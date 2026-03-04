// Run with: npx ts-node --compiler-options '{"module":"commonjs","moduleResolution":"node"}' --transpile-only scripts/seed-supabase.ts
// Requires SUPABASE_URL and SUPABASE_SERVICE_KEY in .env (service role for writes)
// NEVER commit .env — this script runs once from developer machine
// Fetches juz/hizb/rub/page metadata from Quran.com API v4 at runtime

import { createClient } from '@supabase/supabase-js'
import { normalizeArabic } from '../lawh-mobile/lib/arabic/normalize'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ── Achievements seed data (10 achievements as specified) ────────────────────
const ACHIEVEMENTS = [
  { key: 'first_ayah',      name: 'First Ayah',      description: 'Recite your first ayah' },
  { key: 'juz_amma',        name: "Juz' Amma",        description: "Complete all of Juz' Amma" },
  { key: 'streak_7',        name: '7-Day Streak',     description: 'Practice for 7 consecutive days' },
  { key: 'streak_30',       name: '30-Day Streak',    description: 'Practice for 30 consecutive days' },
  { key: 'streak_100',      name: '100-Day Streak',   description: 'Practice for 100 consecutive days' },
  { key: 'perfect_session', name: 'Perfect Session',  description: 'Complete a session with 100% accuracy' },
  { key: 'hafiz',           name: 'Hafiz',            description: 'Memorize the complete Quran' },
  { key: 'speed_reviewer',  name: 'Speed Reviewer',   description: 'Review 50 ayahs in one session' },
  { key: 'iron_memory',     name: 'Iron Memory',      description: 'Achieve strength score 1.0 on 100 ayahs' },
  { key: 'tajweed_master',  name: 'Tajweed Master',   description: 'Complete a session with zero tajweed violations' },
]

// ── Types ────────────────────────────────────────────────────────────────────

interface QuranJsonChapter {
  id: number
  name: string
  transliteration: string
  type: string         // 'meccan' or 'medinan' (lowercase)
  total_verses: number
  verses: { id: number; text: string }[]
}

interface VerseMeta {
  juz: number
  hizb: number
  rub: number
  page: number
}

// ── Fetch verse metadata from Quran.com API v4 ──────────────────────────────
// quran-json provides Uthmanic text but lacks juz/hizb/rub/page per verse.
// The Quran.com API v4 provides this metadata reliably.

async function fetchVerseMetadata(): Promise<Map<string, VerseMeta>> {
  const metaMap = new Map<string, VerseMeta>()
  console.log('Fetching verse metadata from Quran.com API v4...')

  // The API paginates at 50 verses per page. Total: 6236 verses.
  // We fetch by chapter to keep requests organized.
  for (let chapterId = 1; chapterId <= 114; chapterId++) {
    const url = `https://api.quran.com/api/v4/verses/by_chapter/${chapterId}?language=en&per_page=300&fields=verse_key,juz_number,hizb_number,rub_el_hizb_number,page_number`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Quran.com API error for chapter ${chapterId}: ${res.status} ${res.statusText}`)
    }
    const data = await res.json() as {
      verses: {
        verse_key: string
        juz_number: number
        hizb_number: number
        rub_el_hizb_number: number
        page_number: number
      }[]
      pagination: { total_records: number; total_pages: number }
    }

    // Handle pagination if chapter has more than 300 verses (only Al-Baqarah at 286)
    let allVerses = data.verses
    if (data.pagination.total_pages > 1) {
      for (let page = 2; page <= data.pagination.total_pages; page++) {
        const pageUrl = `${url}&page=${page}`
        const pageRes = await fetch(pageUrl)
        if (!pageRes.ok) throw new Error(`Quran.com API pagination error: ${pageRes.status}`)
        const pageData = await pageRes.json() as typeof data
        allVerses = allVerses.concat(pageData.verses)
      }
    }

    for (const v of allVerses) {
      // verse_key format: "1:1", "2:255", etc.
      metaMap.set(v.verse_key, {
        juz: v.juz_number,
        hizb: v.hizb_number,
        rub: v.rub_el_hizb_number,
        page: v.page_number,
      })
    }

    if (chapterId % 20 === 0) {
      console.log(`  Metadata fetched: ${chapterId}/114 chapters`)
    }
  }

  console.log(`  Metadata loaded for ${metaMap.size} verses`)
  if (metaMap.size !== 6236) {
    console.warn(`  WARNING: Expected 6236 verses, got ${metaMap.size}`)
  }
  return metaMap
}

// ── Load chapter data from local quran-json package ─────────────────────────

function loadChapter(chapterId: number): QuranJsonChapter {
  const chapterPath = path.resolve(__dirname, '..', 'node_modules', 'quran-json', 'dist', 'chapters', `${chapterId}.json`)
  const raw = fs.readFileSync(chapterPath, 'utf-8')
  return JSON.parse(raw)
}

// ── Capitalize revelation type to match CHECK constraint ────────────────────

function normalizeRevelationType(type: string): 'Meccan' | 'Medinan' {
  const lower = type.toLowerCase()
  if (lower === 'meccan') return 'Meccan'
  if (lower === 'medinan') return 'Medinan'
  throw new Error(`Unknown revelation type: ${type}`)
}

// ── Main seed function ──────────────────────────────────────────────────────

async function main() {
  console.log('=== Lawh Supabase Seed Script ===\n')

  // 1. Seed achievements
  console.log('Seeding achievements...')
  const { error: achError } = await supabase.from('achievements').upsert(ACHIEVEMENTS, { onConflict: 'key' })
  if (achError) { console.error('Achievements error:', achError); process.exit(1) }
  console.log(`Seeded ${ACHIEVEMENTS.length} achievements\n`)

  // 2. Fetch verse metadata (juz/hizb/rub/page) from Quran.com API
  const verseMeta = await fetchVerseMetadata()

  // 3. Seed surahs and ayahs from quran-json + metadata
  console.log('\nSeeding surahs and ayahs...')
  let totalAyahsInserted = 0

  for (let chapterId = 1; chapterId <= 114; chapterId++) {
    const chapter = loadChapter(chapterId)

    // Determine juz_start: the juz number of the first ayah in this surah
    const firstVerseKey = `${chapterId}:1`
    const firstMeta = verseMeta.get(firstVerseKey)
    if (!firstMeta) {
      console.error(`Missing metadata for ${firstVerseKey}`)
      process.exit(1)
    }

    // Insert surah (upsert on id)
    const { error: surahError } = await supabase.from('surahs').upsert({
      id: chapterId,
      name_arabic: chapter.name,
      name_transliteration: chapter.transliteration,
      name_english: (require('quran-json') as any[])[chapterId - 1].translation,
      ayah_count: chapter.total_verses,
      juz_start: firstMeta.juz,
      revelation_type: normalizeRevelationType(chapter.type),
    }, { onConflict: 'id' })

    if (surahError) {
      console.error(`Surah ${chapterId} error:`, surahError)
      continue
    }

    // Build ayah rows for this surah
    const ayahRows = chapter.verses.map((verse) => {
      const verseKey = `${chapterId}:${verse.id}`
      const meta = verseMeta.get(verseKey)
      if (!meta) {
        throw new Error(`Missing metadata for verse ${verseKey}`)
      }
      return {
        surah_id: chapterId,
        ayah_number: verse.id,
        riwayah: 'hafs',
        text_uthmani: verse.text,
        normalized_text: normalizeArabic(verse.text),
        juz: meta.juz,
        hizb: meta.hizb,
        rub: meta.rub,
        page: meta.page,
      }
    })

    // Upsert ayahs in batches (Supabase has payload limits)
    const BATCH_SIZE = 200
    for (let i = 0; i < ayahRows.length; i += BATCH_SIZE) {
      const batch = ayahRows.slice(i, i + BATCH_SIZE)
      const { error: ayahError } = await supabase.from('ayahs').upsert(batch, {
        onConflict: 'surah_id,ayah_number,riwayah',
      })
      if (ayahError) {
        console.error(`Surah ${chapterId} ayahs batch error:`, ayahError)
      }
    }

    totalAyahsInserted += ayahRows.length

    if (chapterId % 10 === 0) {
      console.log(`  Progress: ${chapterId}/114 surahs (${totalAyahsInserted} ayahs)`)
    }
  }

  console.log(`\nInsertion complete: 114 surahs, ${totalAyahsInserted} ayahs`)

  // 4. Verification: count rows in database
  console.log('\n=== Verification ===')

  const { count: surahCount, error: surahCountErr } = await supabase
    .from('surahs')
    .select('*', { count: 'exact', head: true })
  if (surahCountErr) {
    console.error('Surah count error:', surahCountErr)
  } else {
    console.log(`Surahs in database: ${surahCount} (expected: 114)`)
    if (surahCount !== 114) console.warn('WARNING: Surah count mismatch!')
  }

  const { count: ayahCount, error: ayahCountErr } = await supabase
    .from('ayahs')
    .select('*', { count: 'exact', head: true })
  if (ayahCountErr) {
    console.error('Ayah count error:', ayahCountErr)
  } else {
    console.log(`Ayahs in database: ${ayahCount} (expected: 6236)`)
    if (ayahCount !== 6236) console.warn('WARNING: Ayah count mismatch!')
  }

  console.log('\n=== Seed complete! ===')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})

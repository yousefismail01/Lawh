// Run with: npx ts-node scripts/seed-supabase.ts
// Requires SUPABASE_URL and SUPABASE_SERVICE_KEY in .env (service role for writes)
// NEVER commit .env — this script runs once from developer machine

import { createClient } from '@supabase/supabase-js'
import { normalizeArabic } from '../lawh-mobile/lib/arabic/normalize'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!  // Service role key — server-only, never in mobile
)

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

async function main() {
  console.log('Seeding achievements...')
  const { error: achError } = await supabase.from('achievements').upsert(ACHIEVEMENTS, { onConflict: 'key' })
  if (achError) { console.error('Achievements error:', achError); process.exit(1) }
  console.log(`Seeded ${ACHIEVEMENTS.length} achievements`)

  // ── Quran data ──────────────────────────────────────────────────────────────
  // IMPORTANT: Inspect quran-json field names at runtime before proceeding.
  // Run: node -e "const q = require('quran-json'); console.log(JSON.stringify(Object.keys(q[0][0])))"
  // The field for Uthmanic text may be 'text', 'text_uthmani', or similar.
  // Adjust AYAH_TEXT_FIELD below after inspection.
  //
  // If quran-json doesn't include juz/hizb/rub/page, use @islamic-network/quran-json or
  // fetch from api.alquran.cloud/v1/quran/quran-uthmani-hafs which includes all metadata.
  //
  // This script uses a placeholder structure — executor MUST inspect field names before running.

  console.log('\nMANUAL STEP REQUIRED before seeding ayahs:')
  console.log('1. Run: cd lawh-mobile && npm install quran-json')
  console.log('2. Run: node -e "const q = require(\'quran-json\'); console.log(JSON.stringify(q[0][0], null, 2))"')
  console.log('3. Identify the field names for: Uthmanic text, juz, hizb, rub, page')
  console.log('4. Update the field mapping in scripts/seed-supabase.ts')
  console.log('5. Run this script again\n')

  // Placeholder: uncomment and adjust field names after inspection
  /*
  console.log('Seeding surahs and ayahs...')
  const quranData = require('quran-json') // or your chosen data source

  for (let surahIdx = 0; surahIdx < quranData.length; surahIdx++) {
    const surah = quranData[surahIdx]

    // Insert surah
    const { error: surahError } = await supabase.from('surahs').upsert({
      id: surahIdx + 1,
      name_arabic: surah.name,           // Adjust field name
      name_transliteration: surah.transliteration,
      name_english: surah.translation,
      ayah_count: surah.total_verses,
      juz_start: surah.juz_start ?? 1,
      revelation_type: surah.type,
    }, { onConflict: 'id' })
    if (surahError) { console.error(`Surah ${surahIdx + 1} error:`, surahError); continue }

    // Insert ayahs for this surah
    const ayahRows = surah.verses.map((verse: any, ayahIdx: number) => ({
      surah_id: surahIdx + 1,
      ayah_number: ayahIdx + 1,
      riwayah: 'hafs',
      text_uthmani: verse.text,          // Adjust field name
      normalized_text: normalizeArabic(verse.text),
      juz: verse.juz ?? 1,
      hizb: verse.hizb ?? 1,
      rub: verse.rub ?? 1,
      page: verse.page ?? 1,
    }))

    const { error: ayahError } = await supabase.from('ayahs').upsert(ayahRows, {
      onConflict: 'surah_id,ayah_number,riwayah'
    })
    if (ayahError) { console.error(`Surah ${surahIdx + 1} ayahs error:`, ayahError) }

    if ((surahIdx + 1) % 10 === 0) console.log(`Progress: ${surahIdx + 1}/114 surahs`)
  }
  console.log('Seed complete!')
  */
}

main().catch(console.error)

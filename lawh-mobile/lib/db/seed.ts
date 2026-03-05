import { eq } from 'drizzle-orm'
import { db } from './client'
import { surahs, ayahs, words, seedMetadata } from './schema'
import { fetchChapters, fetchChapterVerses } from '@/lib/api/qul'
import { getJuzForAyah } from '@/lib/data/juzBoundaries'
import { normalizeArabic } from '@/lib/arabic/normalize'

const BATCH_SIZE = 200
const SEED_SOURCE = 'qul-v4'
const MUSHAF_ID = 19

// Arabic-Indic numerals: ٠١٢٣٤٥٦٧٨٩
const ARABIC_INDIC_NUMERAL = /^[\u0660-\u0669\s]+$/

export type SeedProgress = {
  stage: 'chapters' | 'verses'
  current: number
  total: number
  percent: number
}

/**
 * Seeds the local SQLite database from QUL (qul.tarteel.ai).
 * Single entry point — replaces both old seedLocalDatabase and seedWords.
 *
 * ~115 API calls total: 1 for chapters + 114 for verses.
 */
export async function seedFromQul(
  onProgress?: (progress: SeedProgress) => void,
): Promise<void> {
  // Check if already seeded from QUL
  const existing = await db
    .select()
    .from(seedMetadata)
    .where(eq(seedMetadata.key, 'source'))
    .limit(1)
  if (existing.length > 0 && existing[0].value === SEED_SOURCE) return

  // 1. Fetch all 114 chapters
  onProgress?.({ stage: 'chapters', current: 0, total: 114, percent: 0 })
  const chapters = await fetchChapters()

  // Insert surahs
  await db.insert(surahs).values(
    chapters.map((ch) => ({
      id: ch.id,
      nameArabic: ch.name_arabic,
      nameTransliteration: ch.name_simple,
      nameEnglish: ch.translated_name.name,
      ayahCount: ch.verses_count,
      revelationType: ch.revelation_place === 'madinah' ? 'Medinan' : 'Meccan',
      revelationOrder: ch.revelation_order,
      pageStart: ch.pages[0],
      pageEnd: ch.pages[1],
      bismillahPre: ch.bismillah_pre,
    })),
  )
  onProgress?.({ stage: 'chapters', current: 114, total: 114, percent: 100 })

  // 2. For each chapter, fetch verses with words
  const pendingAyahs: (typeof ayahs.$inferInsert)[] = []
  const pendingWords: (typeof words.$inferInsert)[] = []

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i]
    const verses = await fetchChapterVerses(ch.id, MUSHAF_ID)

    for (const verse of verses) {
      // QUL only provides verse_key ("surah:ayah"), not verse_number
      const ayahNumber = parseInt(verse.verse_key.split(':')[1], 10)
      const juz = getJuzForAyah(ch.id, ayahNumber)

      // Build verse text from word-level text_uthmani (excluding end markers)
      const verseText = verse.words
        .filter((w) => !ARABIC_INDIC_NUMERAL.test(w.text_uthmani.trim()))
        .map((w) => w.text_uthmani)
        .join(' ')

      pendingAyahs.push({
        surahId: ch.id,
        ayahNumber,
        riwayah: 'hafs',
        textUthmani: verseText,
        normalizedText: normalizeArabic(verseText),
        juz,
        hizb: 0, // QUL doesn't provide — will be derived later if needed
        rub: 0,
        page: verse.page_number,
      })

      for (const word of verse.words) {
        const isEnd = ARABIC_INDIC_NUMERAL.test(word.text_uthmani.trim())
        pendingWords.push({
          surahId: ch.id,
          ayahNumber,
          riwayah: 'hafs',
          position: word.position,
          pageNumber: word.page_number,
          lineNumber: word.line_number,
          textUthmani: word.text_uthmani,
          codeV4: word.text ?? null,
          charType: isEnd ? 'end' : 'word',
        })
      }
    }

    // Flush ayahs in batches
    while (pendingAyahs.length >= BATCH_SIZE) {
      const batch = pendingAyahs.splice(0, BATCH_SIZE)
      await db.insert(ayahs).values(batch)
      await new Promise<void>((r) => setTimeout(r, 0))
    }

    // Flush words in batches
    while (pendingWords.length >= BATCH_SIZE) {
      const batch = pendingWords.splice(0, BATCH_SIZE)
      await db.insert(words).values(batch)
      await new Promise<void>((r) => setTimeout(r, 0))
    }

    onProgress?.({
      stage: 'verses',
      current: i + 1,
      total: chapters.length,
      percent: ((i + 1) / chapters.length) * 100,
    })
  }

  // Flush remaining ayahs
  while (pendingAyahs.length > 0) {
    const batch = pendingAyahs.splice(0, BATCH_SIZE)
    await db.insert(ayahs).values(batch)
    await new Promise<void>((r) => setTimeout(r, 0))
  }

  // Flush remaining words
  while (pendingWords.length > 0) {
    const batch = pendingWords.splice(0, BATCH_SIZE)
    await db.insert(words).values(batch)
    await new Promise<void>((r) => setTimeout(r, 0))
  }

  // 3. Write seed metadata
  await db.insert(seedMetadata).values([
    { key: 'source', value: SEED_SOURCE },
    { key: 'mushaf_id', value: String(MUSHAF_ID) },
    { key: 'seeded_at', value: new Date().toISOString() },
  ])
}

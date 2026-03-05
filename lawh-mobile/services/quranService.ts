import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { surahs, ayahs, words, seedMetadata } from '@/lib/db/schema'
import type { Riwayah } from '@/types/riwayah'
import { DEFAULT_RIWAYAH } from '@/types/riwayah'

// quranService: reads from local SQLite only (seeded from QUL).
// All downstream code MUST use this service — never query external APIs directly for Quran text.
export const quranService = {
  async getAllSurahs() {
    return db.select().from(surahs).orderBy(surahs.id)
  },

  async getSurah(surahId: number) {
    const result = await db.select().from(surahs).where(eq(surahs.id, surahId)).limit(1)
    return result[0] ?? null
  },

  async getAyahsBySurah(surahId: number, riwayah: Riwayah = DEFAULT_RIWAYAH) {
    return db.select().from(ayahs)
      .where(and(eq(ayahs.surahId, surahId), eq(ayahs.riwayah, riwayah)))
      .orderBy(ayahs.ayahNumber)
  },

  async getAyah(surahId: number, ayahNumber: number, riwayah: Riwayah = DEFAULT_RIWAYAH) {
    const result = await db.select().from(ayahs)
      .where(and(
        eq(ayahs.surahId, surahId),
        eq(ayahs.ayahNumber, ayahNumber),
        eq(ayahs.riwayah, riwayah)
      ))
      .limit(1)
    return result[0] ?? null
  },

  async isSeeded(): Promise<boolean> {
    const result = await db.select().from(seedMetadata)
      .where(eq(seedMetadata.key, 'source'))
      .limit(1)
    return result.length > 0 && result[0].value === 'qul-v4'
  },

  async getWordsByPage(page: number, riwayah: Riwayah = DEFAULT_RIWAYAH) {
    return db.select().from(words)
      .where(and(eq(words.pageNumber, page), eq(words.riwayah, riwayah)))
      .orderBy(words.lineNumber, words.position)
  },

  async getPageMetadata(page: number, riwayah: Riwayah = DEFAULT_RIWAYAH) {
    // Get all words on this page to determine which surahs appear
    const pageWords = await db.select().from(words)
      .where(and(eq(words.pageNumber, page), eq(words.riwayah, riwayah)))
      .orderBy(words.lineNumber, words.position)

    const surahIds = [...new Set(pageWords.map(w => w.surahId))]
    const pageSurahs = await Promise.all(
      surahIds.map(id => db.select().from(surahs).where(eq(surahs.id, id)).limit(1))
    )

    // Get juz from the first ayah on this page
    const firstAyah = await db.select().from(ayahs)
      .where(and(eq(ayahs.page, page), eq(ayahs.riwayah, riwayah)))
      .orderBy(ayahs.ayahNumber)
      .limit(1)

    return {
      pageNumber: page,
      surahs: pageSurahs.flat().map(s => ({ id: s.id, nameArabic: s.nameArabic })),
      juz: firstAyah[0]?.juz ?? 1,
    }
  },

  async getSurahStartPage(surahId: number): Promise<number> {
    const result = await db.select({ pageStart: surahs.pageStart })
      .from(surahs)
      .where(eq(surahs.id, surahId))
      .limit(1)
    return result[0]?.pageStart ?? 1
  },

  async getSurahByPage(page: number) {
    const result = await db.select().from(surahs)
      .where(and(
        eq(surahs.pageStart, page),
      ))
    // If no surah starts exactly on this page, find the surah whose range contains it
    if (result.length > 0) return result[0]

    const all = await db.select().from(surahs).orderBy(surahs.id)
    for (let i = all.length - 1; i >= 0; i--) {
      if (all[i].pageStart <= page && all[i].pageEnd >= page) {
        return all[i]
      }
    }
    return null
  },

  /** Returns a map from 1-indexed line number to {surahId, ayahNumber} for a page */
  async getLineAyahMap(page: number, riwayah: Riwayah = DEFAULT_RIWAYAH): Promise<Map<number, { surahId: number; ayahNumber: number }>> {
    const pageWords = await db.select({
      lineNumber: words.lineNumber,
      surahId: words.surahId,
      ayahNumber: words.ayahNumber,
    }).from(words)
      .where(and(eq(words.pageNumber, page), eq(words.riwayah, riwayah), eq(words.charType, 'word')))
      .orderBy(words.lineNumber, words.position)

    const map = new Map<number, { surahId: number; ayahNumber: number }>()
    for (const w of pageWords) {
      if (!map.has(w.lineNumber)) {
        map.set(w.lineNumber, { surahId: w.surahId, ayahNumber: w.ayahNumber })
      }
    }
    return map
  },

  async getAyahText(surahId: number, ayahNumber: number, riwayah: Riwayah = DEFAULT_RIWAYAH): Promise<string> {
    const pageWords = await db.select().from(words)
      .where(and(
        eq(words.surahId, surahId),
        eq(words.ayahNumber, ayahNumber),
        eq(words.riwayah, riwayah),
      ))
      .orderBy(words.position)
    return pageWords
      .filter(w => w.charType === 'word')
      .map(w => w.textUthmani)
      .join(' ')
  },
}

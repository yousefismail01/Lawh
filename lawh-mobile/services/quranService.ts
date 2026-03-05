import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { surahs, ayahs, words } from '@/lib/db/schema'
import type { Riwayah } from '@/types/riwayah'
import { DEFAULT_RIWAYAH } from '@/types/riwayah'

// quranService: reads from local SQLite first, falls back to Supabase if not cached.
// All downstream code MUST use this service — never query Supabase directly for Quran text.
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
    const result = await db.select().from(surahs).limit(1)
    return result.length > 0
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

  async isWordSeeded(): Promise<boolean> {
    const result = await db.select().from(words).limit(1)
    return result.length > 0
  },

  async getSurahStartPage(surahId: number, riwayah: Riwayah = DEFAULT_RIWAYAH): Promise<number> {
    const result = await db.select({ page: ayahs.page }).from(ayahs)
      .where(and(eq(ayahs.surahId, surahId), eq(ayahs.riwayah, riwayah)))
      .orderBy(ayahs.page)
      .limit(1)
    return result[0]?.page ?? 1
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

import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { surahs, ayahs } from '@/lib/db/schema'
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
}

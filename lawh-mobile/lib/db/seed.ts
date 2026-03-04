import { db } from './client'
import { surahs, ayahs } from './schema'
import { supabase } from '@/lib/supabase'

const BATCH_SIZE = 150  // Tune between 100-200 to avoid watchdog timeout

export type SeedProgress = {
  stage: 'surahs' | 'ayahs'
  percent: number
}

export async function seedLocalDatabase(
  onProgress?: (progress: SeedProgress) => void
): Promise<void> {
  // Check if already seeded
  const existing = await db.select().from(surahs).limit(1)
  if (existing.length > 0) return

  // Fetch surahs from Supabase
  const { data: surahData, error: surahError } = await supabase
    .from('surahs')
    .select('*')
    .order('id')
  if (surahError) throw surahError

  // Insert surahs (small enough to do in one batch)
  await db.insert(surahs).values(
    surahData.map((s) => ({
      id: s.id,
      nameArabic: s.name_arabic,
      nameTransliteration: s.name_transliteration,
      nameEnglish: s.name_english,
      ayahCount: s.ayah_count,
      juzStart: s.juz_start,
      revelationType: s.revelation_type,
    }))
  )
  onProgress?.({ stage: 'surahs', percent: 100 })

  // Fetch ayahs from Supabase (hafs only for offline cache)
  const { data: ayahData, error: ayahError } = await supabase
    .from('ayahs')
    .select('*')
    .eq('riwayah', 'hafs')
    .order('surah_id, ayah_number')
  if (ayahError) throw ayahError

  // Chunked insert to avoid blocking JS thread
  for (let i = 0; i < ayahData.length; i += BATCH_SIZE) {
    const batch = ayahData.slice(i, i + BATCH_SIZE)
    await db.insert(ayahs).values(
      batch.map((a) => ({
        surahId: a.surah_id,
        ayahNumber: a.ayah_number,
        riwayah: a.riwayah,
        textUthmani: a.text_uthmani,
        normalizedText: a.normalized_text,
        juz: a.juz,
        hizb: a.hizb,
        rub: a.rub,
        page: a.page,
      }))
    )
    onProgress?.({ stage: 'ayahs', percent: (i + batch.length) / ayahData.length * 100 })
    // Yield to JS event loop to prevent watchdog timeout on first launch
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  }
}

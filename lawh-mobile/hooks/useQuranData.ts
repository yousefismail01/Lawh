import { useState, useEffect } from 'react'
import { quranService } from '@/services/quranService'
import type { Riwayah } from '@/types/riwayah'
import { DEFAULT_RIWAYAH } from '@/types/riwayah'
import type { Surah, Ayah } from '@/types/quran'

export function useAllSurahs() {
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    quranService.getAllSurahs()
      .then((data) => setSurahs(data as Surah[]))
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { surahs, loading, error }
}

export function useSurahAyahs(surahId: number, riwayah: Riwayah = DEFAULT_RIWAYAH) {
  const [ayahs, setAyahs] = useState<Ayah[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!surahId) return
    setLoading(true)
    quranService.getAyahsBySurah(surahId, riwayah)
      .then((data) => setAyahs(data as Ayah[]))
      .catch(setError)
      .finally(() => setLoading(false))
  }, [surahId, riwayah])

  return { ayahs, loading, error }
}

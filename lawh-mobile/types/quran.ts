import type { Riwayah } from './riwayah'

export interface Surah {
  id: number
  nameArabic: string
  nameTransliteration: string
  nameEnglish: string
  ayahCount: number
  juzStart: number
  revelationType: 'Meccan' | 'Medinan'
}

export interface Ayah {
  id: number
  surahId: number
  ayahNumber: number
  riwayah: Riwayah
  textUthmani: string
  normalizedText: string
  juz: number
  hizb: number
  rub: number
  page: number
}

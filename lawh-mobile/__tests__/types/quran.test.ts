import { Surah, Ayah } from '../../types/quran'

describe('Quran type interfaces', () => {
  test('Surah interface has required fields', () => {
    const surah: Surah = {
      id: 1,
      nameArabic: 'الفاتحة',
      nameTransliteration: 'Al-Fatiha',
      nameEnglish: 'The Opening',
      ayahCount: 7,
      juzStart: 1,
      revelationType: 'Meccan',
    }
    expect(surah.id).toBe(1)
    expect(surah.nameArabic).toBe('الفاتحة')
    expect(surah.nameTransliteration).toBe('Al-Fatiha')
    expect(surah.nameEnglish).toBe('The Opening')
    expect(surah.ayahCount).toBe(7)
    expect(surah.juzStart).toBe(1)
    expect(surah.revelationType).toBe('Meccan')
  })

  test('Ayah interface has required fields', () => {
    const ayah: Ayah = {
      id: 1,
      surahId: 1,
      ayahNumber: 1,
      riwayah: 'hafs',
      textUthmani: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      normalizedText: 'بسم الله الرحمن الرحيم',
      juz: 1,
      hizb: 1,
      rub: 1,
      page: 1,
    }
    expect(ayah.id).toBe(1)
    expect(ayah.surahId).toBe(1)
    expect(ayah.riwayah).toBe('hafs')
    expect(ayah.textUthmani).toContain('بِسْمِ')
    expect(ayah.normalizedText).toContain('بسم')
  })

  test('Surah revelationType only accepts Meccan or Medinan', () => {
    const meccan: Surah = {
      id: 1, nameArabic: 'test', nameTransliteration: 'test',
      nameEnglish: 'test', ayahCount: 1, juzStart: 1, revelationType: 'Meccan',
    }
    const medinan: Surah = {
      id: 2, nameArabic: 'test', nameTransliteration: 'test',
      nameEnglish: 'test', ayahCount: 1, juzStart: 1, revelationType: 'Medinan',
    }
    expect(meccan.revelationType).toBe('Meccan')
    expect(medinan.revelationType).toBe('Medinan')
  })
})

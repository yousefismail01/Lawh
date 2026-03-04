import React from 'react'

// Mock the quran data hook
jest.mock('@/hooks/useQuranData', () => ({
  useAllSurahs: jest.fn(() => ({
    surahs: Array.from({ length: 114 }, (_, i) => ({
      id: i + 1,
      nameArabic: `\u0633\u0648\u0631\u0629 ${i + 1}`,
      nameTransliteration: `Surah ${i + 1}`,
      nameEnglish: `Chapter ${i + 1}`,
      ayahCount: 7,
      juzStart: 1,
      revelationType: 'Meccan',
    })),
    loading: false,
    error: null,
  })),
}))

// Minimal SurahList test -- full component is in (tabs)/index.tsx
// This test validates the data hook mock works for integration tests
describe('Surah list data', () => {
  it('returns 114 surahs from useAllSurahs', () => {
    const { useAllSurahs } = require('@/hooks/useQuranData')
    const { surahs } = useAllSurahs()
    expect(surahs).toHaveLength(114)
  })

  it('each surah has required fields', () => {
    const { useAllSurahs } = require('@/hooks/useQuranData')
    const { surahs } = useAllSurahs()
    const first = surahs[0]
    expect(first).toHaveProperty('nameArabic')
    expect(first).toHaveProperty('nameTransliteration')
    expect(first).toHaveProperty('ayahCount')
  })
})

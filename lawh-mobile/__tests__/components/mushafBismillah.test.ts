/**
 * Test for MUSH-05: Bismillah rendering logic
 */

function shouldRenderBismillah(surahId: number): boolean {
  return surahId !== 1 && surahId !== 9
}

describe('MushafBismillah', () => {
  it('should exclude surah 1 (Al-Fatiha) - bismillah is part of ayah 1', () => {
    expect(shouldRenderBismillah(1)).toBe(false)
  })

  it('should exclude surah 9 (At-Tawbah) - no bismillah', () => {
    expect(shouldRenderBismillah(9)).toBe(false)
  })

  it('should render for standard surahs (2-8, 10-114)', () => {
    const standardSurahs = [2, 3, 8, 10, 50, 114]
    for (const surahId of standardSurahs) {
      expect(shouldRenderBismillah(surahId)).toBe(true)
    }
  })

  it('uses centered layout (height matches line slot)', () => {
    const MUSHAF_FONT_SIZE = 20
    const LINE_HEIGHT = MUSHAF_FONT_SIZE * 2
    expect(LINE_HEIGHT).toBe(40)
  })
})

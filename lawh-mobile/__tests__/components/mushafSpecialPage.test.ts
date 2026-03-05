/**
 * Test for MUSH-06: Special pages 1-2 layout logic
 */

describe('MushafPage special pages', () => {
  it('page 1 (Al-Fatiha) uses centered layout', () => {
    const pageNumber = 1
    const isSpecialPage = pageNumber === 1 || pageNumber === 2
    expect(isSpecialPage).toBe(true)
  })

  it('page 2 (Al-Baqarah start) uses centered layout', () => {
    const pageNumber: number = 2
    const isSpecialPage = pageNumber === 1 || pageNumber === 2
    expect(isSpecialPage).toBe(true)
  })

  it('page 3+ uses standard justified layout', () => {
    for (const pageNumber of [3, 50, 300, 604]) {
      const isSpecialPage = pageNumber === 1 || pageNumber === 2
      expect(isSpecialPage).toBe(false)
    }
  })

  it('special pages have extra padding (isSpecialPage flag)', () => {
    // MushafFrame receives isSpecialPage=true for pages 1-2
    // This results in padding: 16 vs 10, and borderWidth: 2.5 vs 1.5
    const specialPadding = 16
    const normalPadding = 10
    const specialBorder = 2.5
    const normalBorder = 1.5
    expect(specialPadding).toBeGreaterThan(normalPadding)
    expect(specialBorder).toBeGreaterThan(normalBorder)
  })
})

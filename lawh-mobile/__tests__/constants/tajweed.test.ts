import { TAJWEED_COLORS, TajweedRule } from '../../constants/tajweed'

describe('Tajweed constants', () => {
  test('TAJWEED_COLORS has exactly 13 keys', () => {
    expect(Object.keys(TAJWEED_COLORS)).toHaveLength(13)
  })

  test('TAJWEED_COLORS contains all expected rules', () => {
    const expectedRules = [
      'madd_tabii', 'madd_wajib', 'madd_jaiz', 'madd_lazim',
      'ghunnah', 'idgham_ghunnah', 'idgham_bila_ghunnah',
      'iqlab', 'ikhfa',
      'qalqalah_sughra', 'qalqalah_kubra',
      'tafkhim', 'waqf',
    ]
    for (const rule of expectedRules) {
      expect(TAJWEED_COLORS).toHaveProperty(rule)
    }
  })

  test('all color values are strings', () => {
    for (const color of Object.values(TAJWEED_COLORS)) {
      expect(typeof color).toBe('string')
    }
  })

  test('TajweedRule type covers all keys', () => {
    const rule: TajweedRule = 'madd_tabii'
    expect(rule).toBe('madd_tabii')
  })
})

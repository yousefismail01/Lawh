import { Riwayah, RIWAYAT, DEFAULT_RIWAYAH } from '../../types/riwayah'

describe('Riwayah type system', () => {
  test('RIWAYAT has exactly 4 entries', () => {
    expect(Object.keys(RIWAYAT)).toHaveLength(4)
  })

  test('RIWAYAT keys are hafs, warsh, qalun, ad_duri', () => {
    expect(Object.keys(RIWAYAT).sort()).toEqual(['ad_duri', 'hafs', 'qalun', 'warsh'])
  })

  test('only hafs is available', () => {
    expect(RIWAYAT.hafs.available).toBe(true)
    expect(RIWAYAT.warsh.available).toBe(false)
    expect(RIWAYAT.qalun.available).toBe(false)
    expect(RIWAYAT.ad_duri.available).toBe(false)
  })

  test('DEFAULT_RIWAYAH is hafs', () => {
    expect(DEFAULT_RIWAYAH).toBe('hafs')
  })

  test('each RIWAYAT entry has label and available fields', () => {
    for (const [key, value] of Object.entries(RIWAYAT)) {
      expect(value).toHaveProperty('label')
      expect(value).toHaveProperty('available')
      expect(typeof value.label).toBe('string')
      expect(typeof value.available).toBe('boolean')
    }
  })
})

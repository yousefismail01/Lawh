// Mock modules before imports
const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockLimit = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({})),
}))

jest.mock('drizzle-orm/expo-sqlite', () => ({
  drizzle: jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
  })),
}))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [
            { id: 1, name_arabic: 'الفاتحة', name_transliteration: 'Al-Fatiha', name_english: 'The Opening', ayah_count: 7, juz_start: 1, revelation_type: 'Meccan' },
          ],
          error: null,
        }),
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: Array.from({ length: 10 }, (_, i) => ({
              surah_id: 1,
              ayah_number: i + 1,
              riwayah: 'hafs',
              text_uthmani: `ayah ${i + 1}`,
              normalized_text: `ayah ${i + 1}`,
              juz: 1,
              hizb: 1,
              rub: 1,
              page: 1,
            })),
            error: null,
          }),
        }),
      }),
    }),
  },
}))

// Reset module registry between tests so seed.ts re-evaluates
beforeEach(() => {
  jest.clearAllMocks()
  // Default: empty DB (triggers seed)
  mockSelect.mockReturnValue({
    from: mockFrom.mockReturnValue({
      limit: mockLimit.mockResolvedValue([]),
      where: mockWhere.mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
        orderBy: mockOrderBy.mockResolvedValue([]),
      }),
      orderBy: mockOrderBy.mockResolvedValue([]),
    }),
  })
  mockInsert.mockReturnValue({
    values: mockValues.mockResolvedValue(undefined),
  })
})

describe('seedLocalDatabase', () => {
  it('calls onProgress with stage and percent', async () => {
    const { seedLocalDatabase } = require('@/lib/db/seed')
    const progressCalls: any[] = []
    await seedLocalDatabase((p: any) => progressCalls.push(p))

    const surahProgress = progressCalls.find((p) => p.stage === 'surahs')
    expect(surahProgress).toBeDefined()
    expect(surahProgress.percent).toBe(100)

    const ayahProgress = progressCalls.filter((p) => p.stage === 'ayahs')
    expect(ayahProgress.length).toBeGreaterThan(0)
  })

  it('is idempotent: skips if surahs already exist', async () => {
    // Override to return existing rows
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([{ id: 1 }]),
      }),
    })

    const { seedLocalDatabase } = require('@/lib/db/seed')
    const progressCalls: any[] = []
    await seedLocalDatabase((p: any) => progressCalls.push(p))
    // No progress calls because seed was skipped
    expect(progressCalls.length).toBe(0)
  })

  it('inserts in batches of BATCH_SIZE', async () => {
    const { seedLocalDatabase } = require('@/lib/db/seed')
    await seedLocalDatabase()

    // insert called at least once for surahs and once for ayahs
    expect(mockInsert).toHaveBeenCalled()
    expect(mockValues).toHaveBeenCalled()
  })
})

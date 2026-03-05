// Mock modules before imports
const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockLimit = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockWhere = jest.fn()

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
  })),
}))

jest.mock('drizzle-orm/expo-sqlite', () => ({
  drizzle: jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
  })),
}))

jest.mock('@/lib/api/qul', () => ({
  fetchChapters: jest.fn().mockResolvedValue([
    {
      id: 1,
      name_arabic: 'الفاتحة',
      name_simple: 'Al-Fatiha',
      translated_name: { name: 'The Opening' },
      verses_count: 7,
      revelation_place: 'makkah',
      revelation_order: 5,
      bismillah_pre: false,
      pages: [1, 1],
    },
  ]),
  fetchChapterVerses: jest.fn().mockResolvedValue([
    {
      id: 1,
      verse_key: '1:1',
      verse_number: 1,
      text_uthmani: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      page_number: 1,
      words: [
        { position: 1, page_number: 1, line_number: 2, text_uthmani: 'بِسْمِ' },
        { position: 2, page_number: 1, line_number: 2, text_uthmani: 'اللَّهِ' },
        { position: 3, page_number: 1, line_number: 2, text_uthmani: '١' },
      ],
    },
  ]),
}))

jest.mock('@/lib/data/juzBoundaries', () => ({
  getJuzForAyah: jest.fn().mockReturnValue(1),
}))

jest.mock('@/lib/arabic/normalize', () => ({
  normalizeArabic: jest.fn((text: string) => text),
}))

beforeEach(() => {
  jest.clearAllMocks()
  // Default: empty seed_metadata (triggers seed)
  mockSelect.mockReturnValue({
    from: mockFrom.mockReturnValue({
      where: mockWhere.mockReturnValue({
        limit: mockLimit.mockResolvedValue([]),
      }),
      limit: mockLimit.mockResolvedValue([]),
    }),
  })
  mockInsert.mockReturnValue({
    values: mockValues.mockResolvedValue(undefined),
  })
})

describe('seedFromQul', () => {
  it('calls onProgress with stage and percent', async () => {
    const { seedFromQul } = require('@/lib/db/seed')
    const progressCalls: any[] = []
    await seedFromQul((p: any) => progressCalls.push(p))

    const chapterProgress = progressCalls.find((p) => p.stage === 'chapters')
    expect(chapterProgress).toBeDefined()

    const verseProgress = progressCalls.filter((p) => p.stage === 'verses')
    expect(verseProgress.length).toBeGreaterThan(0)
  })

  it('is idempotent: skips if already seeded from QUL', async () => {
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{ key: 'source', value: 'qul' }]),
        }),
      }),
    })

    const { seedFromQul } = require('@/lib/db/seed')
    const progressCalls: any[] = []
    await seedFromQul((p: any) => progressCalls.push(p))
    expect(progressCalls.length).toBe(0)
  })

  it('inserts surahs, ayahs, words, and metadata', async () => {
    const { seedFromQul } = require('@/lib/db/seed')
    await seedFromQul()

    // insert called for surahs, ayahs, words, and seed_metadata
    expect(mockInsert).toHaveBeenCalled()
    expect(mockValues).toHaveBeenCalled()
  })
})

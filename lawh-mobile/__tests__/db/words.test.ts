/**
 * Test stubs for word schema — words are now seeded via seedFromQul in seed.ts
 */

describe('words table schema', () => {
  it.todo(
    'words table has required columns: surahId, ayahNumber, riwayah, position, pageNumber, lineNumber, textUthmani, charType'
  )
  it.todo('seedFromQul inserts word records into the database')
  it.todo('seedFromQul skips seeding if already seeded from QUL')
  it.todo('seedFromQul reports progress during seeding')
})

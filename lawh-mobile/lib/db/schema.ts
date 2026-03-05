import { sqliteTable, integer, text, unique } from 'drizzle-orm/sqlite-core'

export const surahs = sqliteTable('surahs', {
  id: integer('id').primaryKey(),
  nameArabic: text('name_arabic').notNull(),
  nameTransliteration: text('name_transliteration').notNull(),
  nameEnglish: text('name_english').notNull(),
  ayahCount: integer('ayah_count').notNull(),
  revelationType: text('revelation_type').notNull(), // 'Meccan' | 'Medinan'
  revelationOrder: integer('revelation_order').notNull(),
  pageStart: integer('page_start').notNull(),
  pageEnd: integer('page_end').notNull(),
  bismillahPre: integer('bismillah_pre', { mode: 'boolean' }).notNull(),
})

export const ayahs = sqliteTable('ayahs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  surahId: integer('surah_id').notNull().references(() => surahs.id),
  ayahNumber: integer('ayah_number').notNull(),
  riwayah: text('riwayah').notNull().default('hafs'),
  textUthmani: text('text_uthmani').notNull(),
  normalizedText: text('normalized_text').notNull(),
  juz: integer('juz').notNull(),
  hizb: integer('hizb').notNull(),
  rub: integer('rub').notNull(),
  page: integer('page').notNull(),
}, (t) => ({
  uniq: unique().on(t.surahId, t.ayahNumber, t.riwayah),
}))

export const words = sqliteTable('words', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  surahId: integer('surah_id').notNull(),
  ayahNumber: integer('ayah_number').notNull(),
  riwayah: text('riwayah').notNull().default('hafs'),
  position: integer('position').notNull(),
  pageNumber: integer('page_number').notNull(),
  lineNumber: integer('line_number').notNull(),
  textUthmani: text('text_uthmani').notNull(),
  codeV4: text('code_v4'),
  charType: text('char_type').notNull(), // 'word' | 'end'
})

export const seedMetadata = sqliteTable('seed_metadata', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})

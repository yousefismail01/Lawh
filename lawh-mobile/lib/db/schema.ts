import { sqliteTable, integer, text, unique } from 'drizzle-orm/sqlite-core'

export const surahs = sqliteTable('surahs', {
  id: integer('id').primaryKey(),
  nameArabic: text('name_arabic').notNull(),
  nameTransliteration: text('name_transliteration').notNull(),
  nameEnglish: text('name_english').notNull(),
  ayahCount: integer('ayah_count').notNull(),
  juzStart: integer('juz_start').notNull(),
  revelationType: text('revelation_type').notNull(), // 'Meccan' | 'Medinan'
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

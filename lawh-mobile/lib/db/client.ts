import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync } from 'expo-sqlite'
import * as schema from './schema'

// Use openDatabaseSync (SDK 53+ API) — NOT the deprecated openDatabase callback API
const sqlite = openDatabaseSync('lawh.db')

// Create tables if they don't exist. This runs synchronously at module load
// time so all downstream Drizzle queries find the schema ready.
sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS surahs (
    id INTEGER PRIMARY KEY,
    name_arabic TEXT NOT NULL,
    name_transliteration TEXT NOT NULL,
    name_english TEXT NOT NULL,
    ayah_count INTEGER NOT NULL,
    revelation_type TEXT NOT NULL,
    revelation_order INTEGER NOT NULL DEFAULT 0,
    page_start INTEGER NOT NULL DEFAULT 0,
    page_end INTEGER NOT NULL DEFAULT 0,
    bismillah_pre INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS ayahs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    surah_id INTEGER NOT NULL REFERENCES surahs(id),
    ayah_number INTEGER NOT NULL,
    riwayah TEXT NOT NULL DEFAULT 'hafs',
    text_uthmani TEXT NOT NULL,
    normalized_text TEXT NOT NULL,
    juz INTEGER NOT NULL,
    hizb INTEGER NOT NULL,
    rub INTEGER NOT NULL,
    page INTEGER NOT NULL,
    UNIQUE(surah_id, ayah_number, riwayah)
  );

  CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    surah_id INTEGER NOT NULL,
    ayah_number INTEGER NOT NULL,
    riwayah TEXT NOT NULL DEFAULT 'hafs',
    position INTEGER NOT NULL,
    page_number INTEGER NOT NULL,
    line_number INTEGER NOT NULL,
    text_uthmani TEXT NOT NULL,
    code_v4 TEXT,
    char_type TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS seed_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

export const db = drizzle(sqlite, { schema })

/** Raw sqlite handle for DDL operations (e.g. dropping tables during migration) */
export { sqlite }

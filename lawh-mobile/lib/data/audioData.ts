/**
 * Audio data service for Alafasy streaming DB.
 * Opens a bundled SQLite database with ayah-level audio segments.
 *
 * DB schema:
 * - surah_list(surah_number, audio_url, duration)
 * - segments(surah_number, ayah_number, duration_sec, timestamp_from, timestamp_to, segments)
 */

import { openDatabaseSync, importDatabaseFromAssetAsync } from 'expo-sqlite'
import type { SQLiteDatabase } from 'expo-sqlite'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const AUDIO_DB_ASSET = require('@/assets/data/alafasy-streaming.db')

const DB_NAME = 'alafasy-streaming.db'

let audioDb: SQLiteDatabase | null = null
let importPromise: Promise<void> | null = null

/**
 * Open (and cache) the Alafasy audio database.
 * On first call, copies the bundled asset to the SQLite directory,
 * then opens it synchronously.
 */
export async function openAudioDb(): Promise<SQLiteDatabase> {
  if (audioDb) return audioDb

  if (!importPromise) {
    importPromise = importDatabaseFromAssetAsync(DB_NAME, {
      assetId: AUDIO_DB_ASSET,
      forceOverwrite: false,
    })
  }

  await importPromise
  audioDb = openDatabaseSync(DB_NAME)
  return audioDb
}

export interface AyahAudioSegment {
  audioUrl: string
  startMs: number
  endMs: number
}

/**
 * Get the audio segment for a specific ayah.
 * Returns the streaming URL and start/end timestamps in milliseconds.
 */
export async function getAyahAudioSegment(
  surahId: number,
  ayahNumber: number
): Promise<AyahAudioSegment | null> {
  const db = await openAudioDb()

  const segment = db.getFirstSync<{
    timestamp_from: number
    timestamp_to: number
  }>(
    'SELECT timestamp_from, timestamp_to FROM segments WHERE surah_number = ? AND ayah_number = ?',
    [surahId, ayahNumber]
  )

  if (!segment) return null

  const surah = db.getFirstSync<{ audio_url: string }>(
    'SELECT audio_url FROM surah_list WHERE surah_number = ?',
    [surahId]
  )

  if (!surah) return null

  return {
    audioUrl: surah.audio_url,
    startMs: segment.timestamp_from,
    endMs: segment.timestamp_to,
  }
}

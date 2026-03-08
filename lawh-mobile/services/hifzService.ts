/**
 * Hifz Service - SQLite CRUD for hifz_progress and review_schedule
 *
 * Mirrors the Supabase schema with two local-only columns:
 * - consecutive_correct: tracks consecutive correct answers for EF recovery
 * - mistake_count: historical mistake count per ayah
 *
 * All queries include riwayah parameter for multi-riwayah readiness.
 * Uses synchronous SQLite API (per-surah queries are small).
 */

import { openDatabaseSync } from 'expo-sqlite'
import type { SQLiteDatabase } from 'expo-sqlite'
import { getJuzForAyah, JUZ_BOUNDARIES } from '@/lib/data/juzBoundaries'
import { sm2plus, computeStrength } from '@/lib/sr/sm2plus'
import type { Grade, ReviewCard, SurahStatus, ReviewQueueItem, HifzStatus } from '@/lib/sr/types'

// --- Database setup ---

const HIFZ_DB_NAME = 'lawh-hifz.db'
let db: SQLiteDatabase | null = null

function getDb(): SQLiteDatabase {
  if (!db) {
    db = openDatabaseSync(HIFZ_DB_NAME)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS hifz_progress (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        surah_id INTEGER NOT NULL,
        ayah_number INTEGER NOT NULL,
        riwayah TEXT NOT NULL DEFAULT 'hafs',
        status TEXT NOT NULL DEFAULT 'not_started'
          CHECK (status IN ('not_started','in_progress','memorized','needs_review')),
        strength_score REAL NOT NULL DEFAULT 0.0
          CHECK (strength_score BETWEEN 0.0 AND 1.0),
        mistake_count INTEGER NOT NULL DEFAULT 0,
        consecutive_correct INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE (surah_id, ayah_number, riwayah)
      );

      CREATE TABLE IF NOT EXISTS review_schedule (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        surah_id INTEGER NOT NULL,
        ayah_number INTEGER NOT NULL,
        riwayah TEXT NOT NULL DEFAULT 'hafs',
        due_date TEXT NOT NULL,
        interval_days REAL NOT NULL DEFAULT 1.0,
        ease_factor REAL NOT NULL DEFAULT 2.5,
        repetitions INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE (surah_id, ayah_number, riwayah)
      );

      CREATE INDEX IF NOT EXISTS idx_review_due
        ON review_schedule(due_date);
      CREATE INDEX IF NOT EXISTS idx_hifz_surah
        ON hifz_progress(surah_id);
    `)
  }
  return db
}

// --- Row types ---

export interface AyahProgressRow {
  surahId: number
  ayahNumber: number
  status: HifzStatus
  strengthScore: number
  mistakeCount: number
  consecutiveCorrect: number
  dueDate: string | null
  intervalDays: number | null
  easeFactor: number | null
  repetitions: number | null
  updatedAt: string | null
}

interface JuzStats {
  juz: number
  avgStrength: number
  totalTracked: number
}

// --- Service ---

export const hifzService = {
  /** Initialize the hifz database (creates tables if needed) */
  initHifzDb(): void {
    getDb()
  },

  /** Get aggregated status for all surahs that have any tracked progress */
  getSurahStatuses(riwayah: string): SurahStatus[] {
    const database = getDb()
    const rows = database.getAllSync<{
      surah_id: number
      total: number
      memorized: number
      in_progress: number
      needs_review: number
      avg_strength: number
    }>(
      `SELECT
        surah_id,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'memorized' THEN 1 ELSE 0 END) as memorized,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'needs_review' THEN 1 ELSE 0 END) as needs_review,
        AVG(strength_score) as avg_strength
      FROM hifz_progress
      WHERE riwayah = ?
      GROUP BY surah_id
      ORDER BY surah_id`,
      [riwayah]
    )

    return rows.map(row => ({
      surahId: row.surah_id,
      totalAyahs: row.total,
      memorized: row.memorized,
      inProgress: row.in_progress,
      needsReview: row.needs_review,
      avgStrength: Math.round((row.avg_strength ?? 0) * 1000) / 1000,
    }))
  },

  /** Get per-ayah progress detail for a specific surah */
  getAyahProgress(surahId: number, riwayah: string): AyahProgressRow[] {
    const database = getDb()
    const rows = database.getAllSync<{
      surah_id: number
      ayah_number: number
      status: HifzStatus
      strength_score: number
      mistake_count: number
      consecutive_correct: number
      due_date: string | null
      interval_days: number | null
      ease_factor: number | null
      repetitions: number | null
      updated_at: string | null
    }>(
      `SELECT
        hp.surah_id, hp.ayah_number, hp.status, hp.strength_score,
        hp.mistake_count, hp.consecutive_correct, hp.updated_at,
        rs.due_date, rs.interval_days, rs.ease_factor, rs.repetitions
      FROM hifz_progress hp
      LEFT JOIN review_schedule rs
        ON hp.surah_id = rs.surah_id
        AND hp.ayah_number = rs.ayah_number
        AND hp.riwayah = rs.riwayah
      WHERE hp.surah_id = ? AND hp.riwayah = ?
      ORDER BY hp.ayah_number`,
      [surahId, riwayah]
    )

    return rows.map(row => ({
      surahId: row.surah_id,
      ayahNumber: row.ayah_number,
      status: row.status,
      strengthScore: row.strength_score,
      mistakeCount: row.mistake_count,
      consecutiveCorrect: row.consecutive_correct,
      dueDate: row.due_date,
      intervalDays: row.interval_days,
      easeFactor: row.ease_factor,
      repetitions: row.repetitions,
      updatedAt: row.updated_at,
    }))
  },

  /** Get review queue: ayahs due today or overdue, sorted by urgency */
  getReviewQueue(riwayah: string): ReviewQueueItem[] {
    const database = getDb()
    const today = new Date().toISOString().split('T')[0]
    return database.getAllSync<{
      surah_id: number
      ayah_number: number
      due_date: string
      interval_days: number
      ease_factor: number
      repetitions: number
      strength_score: number
      status: HifzStatus
    }>(
      `SELECT rs.surah_id, rs.ayah_number, rs.due_date, rs.interval_days,
              rs.ease_factor, rs.repetitions,
              hp.strength_score, hp.status
       FROM review_schedule rs
       JOIN hifz_progress hp
         ON rs.surah_id = hp.surah_id
         AND rs.ayah_number = hp.ayah_number
         AND rs.riwayah = hp.riwayah
       WHERE rs.due_date <= ?
         AND rs.riwayah = ?
       ORDER BY rs.due_date ASC`,
      [today, riwayah]
    ).map(row => ({
      surahId: row.surah_id,
      ayahNumber: row.ayah_number,
      dueDate: row.due_date,
      intervalDays: row.interval_days,
      easeFactor: row.ease_factor,
      repetitions: row.repetitions,
      strengthScore: row.strength_score,
      status: row.status,
    }))
  },

  /** Get count of reviews due today or overdue */
  getReviewDueCount(riwayah: string): number {
    const database = getDb()
    const today = new Date().toISOString().split('T')[0]
    const row = database.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM review_schedule
       WHERE due_date <= ? AND riwayah = ?`,
      [today, riwayah]
    )
    return row?.count ?? 0
  },

  /** Get total count of memorized ayahs */
  getTotalMemorized(riwayah: string): number {
    const database = getDb()
    const row = database.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM hifz_progress
       WHERE status = 'memorized' AND riwayah = ?`,
      [riwayah]
    )
    return row?.count ?? 0
  },

  /** Get strongest and weakest juz by average strength score */
  getJuzStats(riwayah: string): { strongest: JuzStats | null; weakest: JuzStats | null } {
    const database = getDb()
    // Get all tracked ayahs with their strength scores
    const rows = database.getAllSync<{
      surah_id: number
      ayah_number: number
      strength_score: number
    }>(
      `SELECT surah_id, ayah_number, strength_score
       FROM hifz_progress
       WHERE riwayah = ? AND status != 'not_started'`,
      [riwayah]
    )

    if (rows.length === 0) return { strongest: null, weakest: null }

    // Aggregate by juz
    const juzMap = new Map<number, { total: number; sumStrength: number }>()
    for (const row of rows) {
      const juz = getJuzForAyah(row.surah_id, row.ayah_number)
      const entry = juzMap.get(juz) ?? { total: 0, sumStrength: 0 }
      entry.total += 1
      entry.sumStrength += row.strength_score
      juzMap.set(juz, entry)
    }

    let strongest: JuzStats | null = null
    let weakest: JuzStats | null = null

    for (const [juz, data] of juzMap.entries()) {
      const avg = data.sumStrength / data.total
      const stat: JuzStats = { juz, avgStrength: Math.round(avg * 1000) / 1000, totalTracked: data.total }

      if (!strongest || avg > strongest.avgStrength) strongest = stat
      if (!weakest || avg < weakest.avgStrength) weakest = stat
    }

    return { strongest, weakest }
  },

  /** Upsert an ayah as memorized with initial review schedule */
  markAyahMemorized(surahId: number, ayahNumber: number, riwayah: string): void {
    const database = getDb()
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // Upsert hifz_progress
    database.runSync(
      `INSERT INTO hifz_progress (surah_id, ayah_number, riwayah, status, strength_score, updated_at)
       VALUES (?, ?, ?, 'memorized', 0.0, datetime('now'))
       ON CONFLICT (surah_id, ayah_number, riwayah)
       DO UPDATE SET status = 'memorized', updated_at = datetime('now')`,
      [surahId, ayahNumber, riwayah]
    )

    // Create initial review schedule (interval 1 day, EF 2.5, due tomorrow)
    database.runSync(
      `INSERT INTO review_schedule (surah_id, ayah_number, riwayah, due_date, interval_days, ease_factor, repetitions, updated_at)
       VALUES (?, ?, ?, ?, 1.0, 2.5, 0, datetime('now'))
       ON CONFLICT (surah_id, ayah_number, riwayah)
       DO UPDATE SET due_date = ?, interval_days = 1.0, ease_factor = 2.5, repetitions = 0, updated_at = datetime('now')`,
      [surahId, ayahNumber, riwayah, tomorrowStr, tomorrowStr]
    )
  },

  /** Upsert an ayah as in-progress */
  markAyahInProgress(surahId: number, ayahNumber: number, riwayah: string): void {
    const database = getDb()
    database.runSync(
      `INSERT INTO hifz_progress (surah_id, ayah_number, riwayah, status, updated_at)
       VALUES (?, ?, ?, 'in_progress', datetime('now'))
       ON CONFLICT (surah_id, ayah_number, riwayah)
       DO UPDATE SET status = 'in_progress', updated_at = datetime('now')`,
      [surahId, ayahNumber, riwayah]
    )
  },

  /** Grade an ayah: compute SM-2+, update review_schedule and hifz_progress */
  gradeAyah(surahId: number, ayahNumber: number, riwayah: string, grade: Grade): void {
    const database = getDb()

    // Read current card state from review_schedule + hifz_progress
    const schedule = database.getFirstSync<{
      due_date: string
      interval_days: number
      ease_factor: number
      repetitions: number
    }>(
      `SELECT due_date, interval_days, ease_factor, repetitions
       FROM review_schedule
       WHERE surah_id = ? AND ayah_number = ? AND riwayah = ?`,
      [surahId, ayahNumber, riwayah]
    )

    const progress = database.getFirstSync<{
      consecutive_correct: number
      mistake_count: number
    }>(
      `SELECT consecutive_correct, mistake_count
       FROM hifz_progress
       WHERE surah_id = ? AND ayah_number = ? AND riwayah = ?`,
      [surahId, ayahNumber, riwayah]
    )

    const today = new Date().toISOString().split('T')[0]

    // Build card for SM-2+ computation
    const card: ReviewCard = {
      easeFactor: schedule?.ease_factor ?? 2.5,
      interval: schedule?.interval_days ?? 1,
      repetitions: schedule?.repetitions ?? 0,
      dueDate: schedule?.due_date ?? today,
      consecutiveCorrect: progress?.consecutive_correct ?? 0,
    }

    // Compute SM-2+ result
    const result = sm2plus(card, grade)

    // Determine new status
    const newStatus: HifzStatus = grade < 2 ? 'needs_review' : 'memorized'
    const mistakeIncrement = grade < 2 ? 1 : 0

    // Update review_schedule
    database.runSync(
      `INSERT INTO review_schedule (surah_id, ayah_number, riwayah, due_date, interval_days, ease_factor, repetitions, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT (surah_id, ayah_number, riwayah)
       DO UPDATE SET due_date = ?, interval_days = ?, ease_factor = ?, repetitions = ?, updated_at = datetime('now')`,
      [
        surahId, ayahNumber, riwayah,
        result.dueDate, result.interval, result.easeFactor, result.repetitions,
        result.dueDate, result.interval, result.easeFactor, result.repetitions,
      ]
    )

    // Update hifz_progress
    database.runSync(
      `INSERT INTO hifz_progress (surah_id, ayah_number, riwayah, status, strength_score, consecutive_correct, mistake_count, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT (surah_id, ayah_number, riwayah)
       DO UPDATE SET
         status = ?,
         strength_score = ?,
         consecutive_correct = ?,
         mistake_count = COALESCE(mistake_count, 0) + ?,
         updated_at = datetime('now')`,
      [
        surahId, ayahNumber, riwayah,
        newStatus, result.strengthScore, result.consecutiveCorrect, mistakeIncrement,
        newStatus, result.strengthScore, result.consecutiveCorrect, mistakeIncrement,
      ]
    )
  },

  /** Get the current review card for an ayah (for session use) */
  getAyahCard(surahId: number, ayahNumber: number, riwayah: string): ReviewCard | null {
    const database = getDb()

    const schedule = database.getFirstSync<{
      due_date: string
      interval_days: number
      ease_factor: number
      repetitions: number
    }>(
      `SELECT due_date, interval_days, ease_factor, repetitions
       FROM review_schedule
       WHERE surah_id = ? AND ayah_number = ? AND riwayah = ?`,
      [surahId, ayahNumber, riwayah]
    )

    if (!schedule) return null

    const progress = database.getFirstSync<{
      consecutive_correct: number
    }>(
      `SELECT consecutive_correct
       FROM hifz_progress
       WHERE surah_id = ? AND ayah_number = ? AND riwayah = ?`,
      [surahId, ayahNumber, riwayah]
    )

    return {
      easeFactor: schedule.ease_factor,
      interval: schedule.interval_days,
      repetitions: schedule.repetitions,
      dueDate: schedule.due_date,
      consecutiveCorrect: progress?.consecutive_correct ?? 0,
    }
  },
}

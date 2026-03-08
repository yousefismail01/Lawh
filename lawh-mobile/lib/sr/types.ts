/**
 * SM-2+ Spaced Repetition Type Contracts
 *
 * Shared types for the hifz tracking and review scheduling system.
 * Grade values map to user self-assessment: Again=0, Hard=2, Good=3, Easy=5.
 */

/** Self-assessment grade after reciting an ayah */
export type Grade = 0 | 2 | 3 | 5

/** Current state of a review card (input to SM-2+) */
export interface ReviewCard {
  /** Ease factor, always >= 1.3 */
  easeFactor: number
  /** Interval in days (float) */
  interval: number
  /** Number of successful repetitions */
  repetitions: number
  /** ISO date string (YYYY-MM-DD) */
  dueDate: string
  /** Consecutive correct answers (grade >= 2) for EF recovery */
  consecutiveCorrect: number
}

/** Result of SM-2+ computation (output) */
export interface SM2Result {
  easeFactor: number
  interval: number
  repetitions: number
  /** Next due date as ISO date string (YYYY-MM-DD) */
  dueDate: string
  consecutiveCorrect: number
  /** Strength score 0.0-1.0 */
  strengthScore: number
}

/** Memorization status for an ayah */
export type HifzStatus = 'not_started' | 'in_progress' | 'memorized' | 'needs_review'

/** Aggregated surah-level status for the 114-surah grid */
export interface SurahStatus {
  surahId: number
  totalAyahs: number
  memorized: number
  inProgress: number
  needsReview: number
  avgStrength: number
}

/** Single item in the review queue */
export interface ReviewQueueItem {
  surahId: number
  ayahNumber: number
  dueDate: string
  intervalDays: number
  easeFactor: number
  repetitions: number
  strengthScore: number
  status: HifzStatus
}

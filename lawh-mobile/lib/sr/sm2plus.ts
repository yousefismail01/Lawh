/**
 * SM-2+ Spaced Repetition Algorithm
 *
 * A pure function implementing the SM-2+ algorithm with:
 * - Wozniak ease factor formula
 * - Proportional overdue credit for late reviews
 * - Ease factor recovery after 3 consecutive correct answers
 * - +/-10% interval jitter to prevent review clustering
 * - Minimum ease factor of 1.3
 * - Strength score (0.0-1.0) derived from repetitions and ease factor
 *
 * Grade mapping: Again=0, Hard=2, Good=3, Easy=5
 */

import type { Grade, ReviewCard, SM2Result } from './types'

const MIN_EASE_FACTOR = 1.3
const MAX_EASE_FACTOR = 2.5
const STRENGTH_DENOMINATOR = 8

/**
 * Compute the strength score for an ayah based on repetitions and ease factor.
 * Returns a value between 0.0 (new/weak) and 1.0 (well-memorized).
 *
 * Uses a sigmoid-like formula: min(1.0, (reps * EF) / (reps * EF + 8))
 */
export function computeStrength(repetitions: number, easeFactor: number): number {
  if (repetitions <= 0) return 0
  const product = repetitions * easeFactor
  return Math.min(1.0, product / (product + STRENGTH_DENOMINATOR))
}

/**
 * SM-2+ algorithm: computes the next review schedule for a card given a grade.
 *
 * @param card - Current card state
 * @param grade - Self-assessment grade (0=Again, 2=Hard, 3=Good, 5=Easy)
 * @param today - Reference date (defaults to now, injectable for testing)
 * @returns New card state with updated schedule and strength
 */
export function sm2plus(card: ReviewCard, grade: Grade, today: Date = new Date()): SM2Result {
  let { easeFactor, interval, repetitions, consecutiveCorrect } = card

  // Normalize dates to UTC midnight for consistent day calculations
  const dueDate = new Date(card.dueDate + 'T00:00:00Z')
  const todayStr = today.toISOString().split('T')[0]
  const todayUTC = new Date(todayStr + 'T00:00:00Z')
  const daysOverdue = Math.max(0, (todayUTC.getTime() - dueDate.getTime()) / 86_400_000)

  if (grade < 2) {
    // Failed (Again): reset to beginning
    repetitions = 0
    interval = 1
    consecutiveCorrect = 0
  } else {
    // Passed (Hard/Good/Easy)
    consecutiveCorrect += 1

    if (repetitions === 0) {
      // First successful review
      interval = 1
    } else if (repetitions === 1) {
      // Second successful review
      interval = 6
    } else {
      // Subsequent reviews: multiply by ease factor
      // Proportional overdue credit: when card is overdue and grade >= 3,
      // give partial credit proportional to how late the review was
      const overdueCredit = grade >= 3
        ? Math.min(daysOverdue, interval) / interval
        : 0
      interval = interval * easeFactor * (1 + overdueCredit * 0.1)
    }

    // Ease factor update (Wozniak formula)
    // EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))

    // Ease factor recovery: boost after 3 consecutive correct answers
    if (consecutiveCorrect >= 3 && easeFactor < MAX_EASE_FACTOR) {
      easeFactor += 0.05
    }

    // Clamp ease factor to minimum
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor)

    // Interval jitter: +/-10% randomization to prevent review clustering
    const jitter = 1 + (Math.random() * 0.2 - 0.1)
    interval = Math.max(1, interval * jitter)

    repetitions += 1
  }

  // Compute strength score
  const strengthScore = computeStrength(repetitions, easeFactor)

  // Compute next due date
  const nextDue = new Date(todayUTC)
  nextDue.setUTCDate(nextDue.getUTCDate() + Math.round(interval))
  const nextDueStr = nextDue.toISOString().split('T')[0]

  return {
    easeFactor: Math.round(easeFactor * 100) / 100,
    interval: Math.round(interval * 10) / 10,
    repetitions,
    dueDate: nextDueStr,
    consecutiveCorrect,
    strengthScore: Math.round(strengthScore * 1000) / 1000,
  }
}

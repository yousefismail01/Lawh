import { sm2plus, computeStrength } from './sm2plus'
import type { ReviewCard } from './types'

/** Helper: create a default new card */
function newCard(overrides: Partial<ReviewCard> = {}): ReviewCard {
  return {
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    dueDate: '2026-01-01',
    consecutiveCorrect: 0,
    ...overrides,
  }
}

const TODAY = new Date('2026-01-01')

describe('sm2plus', () => {
  // --- Grade 0 (Again) ---
  describe('Grade 0 (Again)', () => {
    it('resets repetitions to 0, interval to 1, consecutiveCorrect to 0', () => {
      const card = newCard({ repetitions: 5, interval: 30, consecutiveCorrect: 4 })
      const result = sm2plus(card, 0, TODAY)
      expect(result.repetitions).toBe(0)
      expect(result.interval).toBe(1)
      expect(result.consecutiveCorrect).toBe(0)
    })
  })

  // --- Grade 2 (Hard) ---
  describe('Grade 2 (Hard)', () => {
    it('on first review sets interval to 1 and increments repetitions', () => {
      const card = newCard({ repetitions: 0 })
      const result = sm2plus(card, 2, TODAY)
      // After jitter, interval should be close to 1 (within +/-10%)
      expect(result.interval).toBeGreaterThanOrEqual(0.9)
      expect(result.interval).toBeLessThanOrEqual(1.1)
      expect(result.repetitions).toBe(1)
    })
  })

  // --- Grade 3 (Good) ---
  describe('Grade 3 (Good)', () => {
    it('on second review sets interval to ~6 and increments repetitions', () => {
      const card = newCard({ repetitions: 1, interval: 1 })
      const result = sm2plus(card, 3, TODAY)
      // After jitter, interval should be close to 6 (within +/-10%)
      expect(result.interval).toBeGreaterThanOrEqual(5.4)
      expect(result.interval).toBeLessThanOrEqual(6.6)
      expect(result.repetitions).toBe(2)
    })
  })

  // --- Grade 5 (Easy) ---
  describe('Grade 5 (Easy)', () => {
    it('on third+ review multiplies interval by ease factor', () => {
      const card = newCard({ repetitions: 2, interval: 6, easeFactor: 2.5 })
      const result = sm2plus(card, 5, TODAY)
      // Base: 6 * 2.5 = 15, with jitter: 13.5-16.5
      expect(result.interval).toBeGreaterThanOrEqual(13.5)
      expect(result.interval).toBeLessThanOrEqual(16.5)
      expect(result.repetitions).toBe(3)
    })
  })

  // --- Ease factor minimum ---
  describe('Ease factor bounds', () => {
    it('never goes below 1.3 even after many Hard grades', () => {
      let card = newCard({ easeFactor: 1.5 })
      // Apply many Hard (2) grades to push EF down
      for (let i = 0; i < 20; i++) {
        const result = sm2plus(card, 2, TODAY)
        expect(result.easeFactor).toBeGreaterThanOrEqual(1.3)
        card = {
          easeFactor: result.easeFactor,
          interval: result.interval,
          repetitions: result.repetitions,
          dueDate: result.dueDate,
          consecutiveCorrect: result.consecutiveCorrect,
        }
      }
    })
  })

  // --- Ease factor recovery ---
  describe('Ease factor recovery', () => {
    it('adds +0.05 after 3 consecutive correct (grade >= 3)', () => {
      const card = newCard({
        easeFactor: 2.0,
        consecutiveCorrect: 2,
        repetitions: 5,
        interval: 10,
      })
      const result = sm2plus(card, 3, TODAY)
      // consecutiveCorrect becomes 3, which triggers recovery
      expect(result.consecutiveCorrect).toBe(3)
      // EF should be higher than without recovery
      // Wozniak formula for grade 3: EF + 0.1 - (5-3)*(0.08 + (5-3)*0.02) = EF + 0.1 - 2*0.12 = EF - 0.14
      // With recovery: EF - 0.14 + 0.05 = EF - 0.09
      // So result should be 2.0 - 0.09 = 1.91
      expect(result.easeFactor).toBeCloseTo(1.91, 1)
    })
  })

  // --- Interval jitter ---
  describe('Interval jitter', () => {
    it('produces values within +/-10% of computed interval over 100 iterations', () => {
      const card = newCard({ repetitions: 2, interval: 10, easeFactor: 2.5 })
      const baseInterval = 10 * 2.5 // = 25
      const results: number[] = []

      for (let i = 0; i < 100; i++) {
        const result = sm2plus(card, 5, TODAY)
        results.push(result.interval)
      }

      const min = Math.min(...results)
      const max = Math.max(...results)
      // All values should be within +/-10% of baseInterval
      expect(min).toBeGreaterThanOrEqual(baseInterval * 0.9)
      expect(max).toBeLessThanOrEqual(baseInterval * 1.1)
      // Jitter should produce some variance (not all identical)
      expect(max - min).toBeGreaterThan(0)
    })
  })

  // --- Proportional overdue credit ---
  describe('Proportional overdue credit', () => {
    it('increases interval when card is overdue and grade >= 3', () => {
      const onTimeCard = newCard({
        repetitions: 2,
        interval: 10,
        easeFactor: 2.5,
        dueDate: '2026-01-01', // due today
      })
      const overdueCard = newCard({
        repetitions: 2,
        interval: 10,
        easeFactor: 2.5,
        dueDate: '2025-12-22', // 10 days overdue
      })

      // Run multiple times to average out jitter
      let onTimeSum = 0
      let overdueSum = 0
      const iterations = 50
      for (let i = 0; i < iterations; i++) {
        onTimeSum += sm2plus(onTimeCard, 3, TODAY).interval
        overdueSum += sm2plus(overdueCard, 3, TODAY).interval
      }
      const onTimeAvg = onTimeSum / iterations
      const overdueAvg = overdueSum / iterations

      // Overdue card should get a longer interval due to overdue credit
      expect(overdueAvg).toBeGreaterThan(onTimeAvg)
    })
  })

  // --- Due date computation ---
  describe('Due date', () => {
    it('is computed correctly from today + interval days', () => {
      const card = newCard({ repetitions: 0 })
      const result = sm2plus(card, 3, TODAY)
      // Interval ~1 day (with jitter 0.9-1.1), so due date should be Jan 2
      const due = new Date(result.dueDate)
      expect(due.getFullYear()).toBe(2026)
      expect(due.getMonth()).toBe(0) // January
      expect(due.getDate()).toBe(2) // Jan 2
    })
  })
})

describe('computeStrength', () => {
  it('returns 0.0 for new cards (0 reps)', () => {
    expect(computeStrength(0, 2.5)).toBe(0)
  })

  it('approaches 1.0 as repetitions increase', () => {
    const low = computeStrength(2, 2.5)
    const mid = computeStrength(10, 2.5)
    const high = computeStrength(50, 2.5)
    expect(low).toBeLessThan(mid)
    expect(mid).toBeLessThan(high)
    expect(high).toBeGreaterThan(0.9)
  })

  it('is always between 0.0 and 1.0', () => {
    for (let reps = 0; reps <= 100; reps++) {
      for (const ef of [1.3, 1.5, 2.0, 2.5, 3.0]) {
        const s = computeStrength(reps, ef)
        expect(s).toBeGreaterThanOrEqual(0)
        expect(s).toBeLessThanOrEqual(1)
      }
    }
  })
})

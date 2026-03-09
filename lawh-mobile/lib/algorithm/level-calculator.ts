/**
 * Student level determination based on total memorized juz.
 * Madinah method: 5 tiers with increasing review load.
 *
 * Pure TypeScript — no external dependencies.
 */

import type { StudentLevel, LevelConfig } from './types';

/**
 * Level thresholds (inclusive upper bounds):
 * L1: 0-3 juz, L2: 4-7, L3: 8-15, L4: 16-25, L5: 26-30
 */
const LEVEL_THRESHOLDS: { maxJuz: number; level: StudentLevel }[] = [
  { maxJuz: 3, level: 1 },
  { maxJuz: 7, level: 2 },
  { maxJuz: 15, level: 3 },
  { maxJuz: 25, level: 4 },
  { maxJuz: 30, level: 5 },
];

const LEVEL_CONFIGS: Record<StudentLevel, LevelConfig> = {
  1: {
    sabaqPagesPerDay: 1,
    sabqiWindowJuz: 1,
    dhorPagesPerDay: 2,
    dhorCycleDays: 5,
    activeDaysPerWeek: 6,
    sessionSplit: [50, 25, 25],
  },
  2: {
    sabaqPagesPerDay: 1,
    sabqiWindowJuz: 2,
    dhorPagesPerDay: 4,
    dhorCycleDays: 14,
    activeDaysPerWeek: 6,
    sessionSplit: [40, 30, 30],
  },
  3: {
    sabaqPagesPerDay: 0.75,
    sabqiWindowJuz: 3,
    dhorPagesPerDay: 8,
    dhorCycleDays: 42,
    activeDaysPerWeek: 6,
    sessionSplit: [30, 30, 40],
  },
  4: {
    sabaqPagesPerDay: 0.5,
    sabqiWindowJuz: 3,
    dhorPagesPerDay: 10,
    dhorCycleDays: 56,
    activeDaysPerWeek: 5,
    sessionSplit: [20, 30, 50],
  },
  5: {
    sabaqPagesPerDay: 0,
    sabqiWindowJuz: 3,
    dhorPagesPerDay: 20,
    dhorCycleDays: 10,
    activeDaysPerWeek: 7,
    sessionSplit: [0, 20, 80],
  },
};

/**
 * Determine student level from total memorized juz count.
 * Fractional juz are rounded up to the next integer for threshold comparison.
 */
export function getStudentLevel(totalJuz: number): StudentLevel {
  // Use ceiling for fractional juz (3.1 juz => treated as 4 => level 2)
  const effectiveJuz = Math.ceil(totalJuz);

  for (const { maxJuz, level } of LEVEL_THRESHOLDS) {
    if (effectiveJuz <= maxJuz) {
      return level;
    }
  }

  return 5;
}

/**
 * Get the configuration parameters for a given student level.
 */
export function getLevelConfig(level: StudentLevel): LevelConfig {
  return { ...LEVEL_CONFIGS[level] };
}

/**
 * Sabaq (new memorization) throttle.
 * Auto-pauses or reduces new memorization when dhor/sabqi quality drops.
 *
 * Pure TypeScript — no external dependencies.
 */

import type { StudentLevel, StudentState, SabaqAllowance } from './types';
import { QUALITY_THRESHOLD_DHOR } from './types';
import { getLevelConfig } from './level-calculator';

const CONSECUTIVE_WEAK_DAYS_THRESHOLD = 3;

/**
 * Check whether sabaq should be throttled based on dhor performance.
 *
 * Throttle triggers:
 * - Average dhor quality below 3.0
 * - 3+ consecutive weak dhor days
 */
export function shouldThrottleSabaq(
  dhorAvgQuality: number,
  consecutiveWeakDhorDays: number,
): boolean {
  if (dhorAvgQuality < QUALITY_THRESHOLD_DHOR) return true;
  if (consecutiveWeakDhorDays >= CONSECUTIVE_WEAK_DAYS_THRESHOLD) return true;
  return false;
}

/**
 * Calculate full sabaq allowance considering level, quality, and student state.
 *
 * Returns whether sabaq is allowed and how many pages.
 */
export function getSabaqAllowance(
  studentState: StudentState,
  level: StudentLevel,
  dhorAvgQuality: number,
  consecutiveWeakDhorDays: number,
): SabaqAllowance {
  const config = getLevelConfig(level);

  // Level 5 students don't get new memorization
  if (config.sabaqPagesPerDay === 0) {
    return {
      allowed: false,
      pagesAllowed: 0,
      reason: 'Level 5: focus on revision only, no new memorization',
    };
  }

  // No current sabaq juz means review-only mode
  if (studentState.currentSabaqJuz === null) {
    return {
      allowed: false,
      pagesAllowed: 0,
      reason: 'No active sabaq juz — review-only mode',
    };
  }

  // Skip quality check if student has no memorized juz (nothing to measure)
  const hasDhorData = studentState.memorizedJuz.length > 0;
  if (hasDhorData && shouldThrottleSabaq(dhorAvgQuality, consecutiveWeakDhorDays)) {
    const reasons: string[] = [];
    if (dhorAvgQuality < QUALITY_THRESHOLD_DHOR) {
      reasons.push(`Dhor quality ${dhorAvgQuality.toFixed(1)} below ${QUALITY_THRESHOLD_DHOR}`);
    }
    if (consecutiveWeakDhorDays >= CONSECUTIVE_WEAK_DAYS_THRESHOLD) {
      reasons.push(`${consecutiveWeakDhorDays} consecutive weak dhor days`);
    }
    return {
      allowed: false,
      pagesAllowed: 0,
      reason: `Sabaq paused: ${reasons.join('; ')} — focus on revision quality`,
    };
  }

  return {
    allowed: true,
    pagesAllowed: config.sabaqPagesPerDay,
    reason: 'Dhor quality stable — new memorization allowed',
  };
}

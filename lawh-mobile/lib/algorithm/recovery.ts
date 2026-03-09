/**
 * Recovery system for missed days.
 * Generates catch-up plans that spread missed dhor review
 * across extra days without overwhelming the student.
 *
 * Pure TypeScript — no external dependencies.
 */

import type { StudentState, DhorCycle, RecoveryPlan, DailySession } from './types';
import { MAX_MISSED_DAYS } from './types';
import { getStudentLevel } from './level-calculator';
import { getDhorAssignment } from './dhor-scheduler';

/**
 * Generate a recovery plan for missed days.
 *
 * Rules:
 * - Clamp missedDays to MAX_MISSED_DAYS (7)
 * - catchUpDays = ceil(missedDays * 1.5)
 * - Each catch-up day: 1.5x normal dhor load, no sabaq, reduced sabqi
 * - Generates sequential DailySession[] for the catch-up period
 */
export function generateRecoveryPlan(
  missedDays: number,
  studentState: StudentState,
  dhorCycle: DhorCycle,
  startDate: string,
): RecoveryPlan {
  const clampedMissed = Math.min(Math.max(missedDays, 0), MAX_MISSED_DAYS);

  if (clampedMissed === 0) {
    return {
      missedDays: 0,
      catchUpDays: 0,
      dailySessions: [],
    };
  }

  const catchUpDays = Math.ceil(clampedMissed * 1.5);
  const level = getStudentLevel(studentState.memorizedJuz.length);

  // We need to cover the missed dhor days spread across catch-up days
  // Each catch-up day gets ~1.5x normal dhor volume
  const dailySessions: DailySession[] = [];
  const baseDate = new Date(startDate);

  for (let day = 0; day < catchUpDays; day++) {
    const sessionDate = new Date(baseDate);
    sessionDate.setDate(baseDate.getDate() + day);
    const dateStr = sessionDate.toISOString().split('T')[0];

    // Get normal dhor assignment for the day
    const normalDhor = getDhorAssignment(dhorCycle, day);

    // Add extra dhor from the "missed" rotation (offset by catchUpDays)
    const extraDhor = getDhorAssignment(dhorCycle, day + catchUpDays);

    // Merge: normal + half of extra (1.5x total)
    let dhor = [...normalDhor];
    const extraPages = Math.ceil(
      extraDhor.reduce((s, e) => s + (e.endPage - e.startPage + 1), 0) / 2,
    );

    let accum = 0;
    for (const entry of extraDhor) {
      if (accum >= extraPages) break;
      const pages = entry.endPage - entry.startPage + 1;
      if (accum + pages <= extraPages) {
        dhor.push(entry);
        accum += pages;
      } else {
        const remaining = extraPages - accum;
        dhor.push({
          ...entry,
          endPage: entry.startPage + remaining - 1,
        });
        accum += remaining;
      }
    }

    const totalPages = dhor.reduce((s, e) => s + (e.endPage - e.startPage + 1), 0);

    dailySessions.push({
      sabaq: null, // No sabaq during recovery
      sabqi: [], // Reduced sabqi (empty during recovery)
      dhor,
      totalPages,
      sessionDate: dateStr,
    });
  }

  return {
    missedDays: clampedMissed,
    catchUpDays,
    dailySessions,
  };
}

/**
 * Daily session generator.
 * Combines sabaq + sabqi + dhor into a complete daily session
 * with priority ordering and page caps.
 *
 * Pure TypeScript — no external dependencies.
 */

import type { StudentState, DhorCycle, DailySession, SabqiAssignment } from './types';
import { MAX_DHOR_PAGES_PER_DAY } from './types';
import { getStudentLevel, getLevelConfig } from './level-calculator';
import { getDhorAssignment } from './dhor-scheduler';
import { getSabqiRange, distributeSabqiWeekly } from './sabqi-manager';
import { getSabaqAllowance } from './sabaq-throttle';

/**
 * Generate a complete daily session for the student.
 *
 * Priority order:
 * 1. Dhor (always — revision is non-negotiable)
 * 2. Sabqi (active days only — recent juz need reinforcement)
 * 3. Sabaq (if allowed by throttle and on active day)
 *
 * Non-active days: dhor-only at 50% normal volume.
 */
export function generateDailySession(
  studentState: StudentState,
  dhorCycle: DhorCycle,
  dayNumber: number,
  dayOfWeek: number,
  isActiveDay: boolean,
  dhorAvgQuality: number,
  consecutiveWeakDhorDays: number,
  sessionDate: string,
): DailySession {
  const totalJuz = studentState.memorizedJuz.length;
  const level = getStudentLevel(totalJuz);
  const config = getLevelConfig(level);

  // 1. Dhor assignment (always present if there's memorized juz)
  let dhor = getDhorAssignment(dhorCycle, dayNumber);

  // Non-active day: reduce dhor to ~50%
  if (!isActiveDay && dhor.length > 0) {
    const halfPages = Math.ceil(
      dhor.reduce((s, e) => s + (e.endPage - e.startPage + 1), 0) / 2,
    );
    let accum = 0;
    const reduced = [];
    for (const entry of dhor) {
      const pages = entry.endPage - entry.startPage + 1;
      if (accum + pages <= halfPages) {
        reduced.push(entry);
        accum += pages;
      } else if (accum < halfPages) {
        const remaining = halfPages - accum;
        reduced.push({
          ...entry,
          endPage: entry.startPage + remaining - 1,
        });
        accum += remaining;
        break;
      }
    }
    dhor = reduced;
  }

  // Non-active day: dhor only
  if (!isActiveDay) {
    const totalPages = dhor.reduce((s, e) => s + (e.endPage - e.startPage + 1), 0);
    return {
      sabaq: null,
      sabqi: [],
      dhor,
      totalPages,
      sessionDate,
    };
  }

  // 2. Sabqi assignment (active days)
  const sabqiJuz = getSabqiRange(
    studentState.currentSabaqJuz,
    studentState.memorizedJuz,
    level,
  );
  const sabqiWeekly = distributeSabqiWeekly(sabqiJuz, studentState.activeDaysPerWeek, level);
  const sabqiDayIndex = dayOfWeek % Math.max(studentState.activeDaysPerWeek, 1);
  const sabqi: SabqiAssignment[] = sabqiWeekly.get(sabqiDayIndex) ?? [];

  // 3. Sabaq allowance
  const allowance = getSabaqAllowance(studentState, level, dhorAvgQuality, consecutiveWeakDhorDays);
  let sabaq: DailySession['sabaq'] = null;

  if (allowance.allowed && studentState.currentSabaqJuz !== null) {
    const startPage = studentState.currentSabaqPage;
    const endPage = Math.min(
      startPage + Math.ceil(allowance.pagesAllowed) - 1,
      20, // max pages in a juz
    );
    sabaq = {
      juz: studentState.currentSabaqJuz,
      startPage,
      endPage,
    };
  }

  // Calculate totals
  const dhorPages = dhor.reduce((s, e) => s + (e.endPage - e.startPage + 1), 0);
  const sabqiPages = sabqi.reduce((s, e) => s + (e.endPage - e.startPage + 1), 0);
  const sabaqPages = sabaq ? (sabaq.endPage - sabaq.startPage + 1) : 0;
  const totalPages = dhorPages + sabqiPages + sabaqPages;

  return {
    sabaq,
    sabqi,
    dhor,
    totalPages,
    sessionDate,
  };
}

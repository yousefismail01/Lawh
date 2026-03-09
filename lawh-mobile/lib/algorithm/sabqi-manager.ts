/**
 * Sabqi (recent review) manager.
 * Determines the sliding window of recently-memorized juz that need
 * frequent review before they transition to dhor.
 *
 * Pure TypeScript — no external dependencies.
 */

import type { StudentLevel, MemorizedJuz, SabqiAssignment } from './types';
import { PAGES_PER_JUZ } from './types';
import { getLevelConfig } from './level-calculator';

/**
 * Get the sabqi range: juz immediately behind the current sabaq position.
 *
 * The window excludes the currentSabaqJuz itself (that's sabaq, not sabqi).
 * Looks backward in the memorizedJuz array by sabqiWindowJuz positions.
 * Handles non-contiguous memorization by using the sorted order of memorized juz.
 */
export function getSabqiRange(
  currentSabaqJuz: number | null,
  memorizedJuz: MemorizedJuz[],
  level: StudentLevel,
): MemorizedJuz[] {
  if (currentSabaqJuz === null || memorizedJuz.length === 0) {
    return [];
  }

  const config = getLevelConfig(level);
  const windowSize = config.sabqiWindowJuz;

  // Sort memorized juz by juz number
  const sorted = [...memorizedJuz].sort((a, b) => a.juz - b.juz);

  // Find index of currentSabaqJuz in the sorted array
  const sabaqIndex = sorted.findIndex(j => j.juz === currentSabaqJuz);

  // If currentSabaqJuz is not in memorized list, take the last N juz
  let endIndex: number;
  if (sabaqIndex === -1) {
    // Current sabaq isn't memorized yet — take the last windowSize juz
    endIndex = sorted.length;
  } else {
    // Exclude the current sabaq juz
    endIndex = sabaqIndex;
  }

  if (endIndex <= 0) {
    return [];
  }

  const startIndex = Math.max(0, endIndex - windowSize);
  return sorted.slice(startIndex, endIndex);
}

/**
 * Distribute sabqi juz pages across active days of the week.
 * Each sabqi juz gets reviewed once per week.
 *
 * Returns a Map where key = day index (0 to activeDaysPerWeek-1),
 * value = list of SabqiAssignment for that day.
 */
export function distributeSabqiWeekly(
  sabqiJuz: MemorizedJuz[],
  activeDaysPerWeek: number,
  level: StudentLevel,
): Map<number, SabqiAssignment[]> {
  const result = new Map<number, SabqiAssignment[]>();

  if (sabqiJuz.length === 0 || activeDaysPerWeek <= 0) {
    return result;
  }

  // Total pages to review
  const totalPages = sabqiJuz.reduce((sum, j) => sum + j.pages, 0);
  const pagesPerDay = Math.ceil(totalPages / activeDaysPerWeek);

  // Build a flat list of all page assignments
  const allAssignments: SabqiAssignment[] = [];
  for (const juz of sabqiJuz) {
    for (let start = 1; start <= juz.pages; start += pagesPerDay) {
      const end = Math.min(start + pagesPerDay - 1, juz.pages);
      allAssignments.push({ juz: juz.juz, startPage: start, endPage: end });
    }
  }

  // Distribute assignments across days
  for (let i = 0; i < allAssignments.length; i++) {
    const dayIndex = i % activeDaysPerWeek;
    if (!result.has(dayIndex)) {
      result.set(dayIndex, []);
    }
    result.get(dayIndex)!.push(allAssignments[i]);
  }

  return result;
}

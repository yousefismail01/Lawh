/**
 * Dhor (long-term revision) cycle scheduler.
 * Generates a rotation of all memorized juz with priority weighting
 * for weak juz (avgQuality < 3.0).
 *
 * Pure TypeScript — no external dependencies.
 */

import type { StudentLevel, MemorizedJuz, DhorCycle, DhorCycleEntry } from './types';
import { PAGES_PER_JUZ, MAX_DHOR_PAGES_PER_DAY, QUALITY_THRESHOLD_DHOR } from './types';
import { getLevelConfig } from './level-calculator';

/**
 * Generate a complete dhor rotation cycle for the student's memorized juz.
 *
 * Algorithm:
 * 1. Sort juz by priority: lowest quality first, then longest since review, then most lapses
 * 2. Weak juz (avgQuality < 3.0) get 2x appearance in the rotation
 * 3. Split each juz's pages into daily chunks based on level's dhorPagesPerDay
 * 4. Assemble into an ordered cycle
 */
export function generateDhorCycle(
  memorizedJuz: MemorizedJuz[],
  level: StudentLevel,
): DhorCycle {
  if (memorizedJuz.length === 0) {
    return { entries: [], cycleLengthDays: 0 };
  }

  const config = getLevelConfig(level);
  const pagesPerDay = config.dhorPagesPerDay;

  // Sort by: lowest quality first, then oldest review, then most lapses
  const sorted = [...memorizedJuz].sort((a, b) => {
    if (a.avgQuality !== b.avgQuality) return a.avgQuality - b.avgQuality;
    if (a.lastReviewed !== b.lastReviewed) return a.lastReviewed.localeCompare(b.lastReviewed);
    return b.lapses - a.lapses;
  });

  // Build the page-level entries for each juz
  const allEntries: DhorCycleEntry[] = [];

  for (const juz of sorted) {
    const isWeak = juz.avgQuality < QUALITY_THRESHOLD_DHOR;
    const repetitions = isWeak ? 2 : 1;

    for (let rep = 0; rep < repetitions; rep++) {
      const pages = juz.pages;
      for (let start = 1; start <= pages; start += pagesPerDay) {
        const end = Math.min(start + pagesPerDay - 1, pages);
        allEntries.push({
          juz: juz.juz,
          startPage: start,
          endPage: end,
          priority: isWeak ? 'high' : 'normal',
        });
      }
    }
  }

  // Group entries into daily assignments, each capped at pagesPerDay
  const dailyGroups: DhorCycleEntry[][] = [];
  let currentGroup: DhorCycleEntry[] = [];
  let currentGroupPages = 0;

  for (const entry of allEntries) {
    const entryPages = entry.endPage - entry.startPage + 1;

    if (currentGroupPages + entryPages > MAX_DHOR_PAGES_PER_DAY && currentGroup.length > 0) {
      dailyGroups.push(currentGroup);
      currentGroup = [];
      currentGroupPages = 0;
    }

    currentGroup.push(entry);
    currentGroupPages += entryPages;
  }

  if (currentGroup.length > 0) {
    dailyGroups.push(currentGroup);
  }

  // Flatten back but track day boundaries via cycleLengthDays
  return {
    entries: allEntries,
    cycleLengthDays: dailyGroups.length,
  };
}

/**
 * Get the dhor assignment for a specific day in the cycle.
 * Uses modulo wrapping so the cycle repeats indefinitely.
 * Caps at MAX_DHOR_PAGES_PER_DAY.
 */
export function getDhorAssignment(
  cycle: DhorCycle,
  dayNumber: number,
): DhorCycleEntry[] {
  if (cycle.entries.length === 0 || cycle.cycleLengthDays === 0) {
    return [];
  }

  const config = getLevelConfig(1); // We need pagesPerDay from the cycle context
  // Reconstruct daily groups from entries
  const dailyGroups: DhorCycleEntry[][] = [];
  let currentGroup: DhorCycleEntry[] = [];
  let currentGroupPages = 0;

  for (const entry of cycle.entries) {
    const entryPages = entry.endPage - entry.startPage + 1;

    if (currentGroupPages + entryPages > MAX_DHOR_PAGES_PER_DAY && currentGroup.length > 0) {
      dailyGroups.push(currentGroup);
      currentGroup = [];
      currentGroupPages = 0;
    }

    currentGroup.push(entry);
    currentGroupPages += entryPages;
  }

  if (currentGroup.length > 0) {
    dailyGroups.push(currentGroup);
  }

  const effectiveDay = dayNumber % dailyGroups.length;
  return dailyGroups[effectiveDay];
}

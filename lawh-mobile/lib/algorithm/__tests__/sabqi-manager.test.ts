import { getSabqiRange, distributeSabqiWeekly } from '../sabqi-manager';
import type { MemorizedJuz } from '../types';

function makeJuz(juz: number, avgQuality = 4.0): MemorizedJuz {
  return { juz, pages: 20, avgQuality, lastReviewed: '2026-01-01', lapses: 0 };
}

describe('getSabqiRange', () => {
  it('returns correct window for level 2 (2 juz window)', () => {
    const memorized = [makeJuz(1), makeJuz(2), makeJuz(3), makeJuz(4), makeJuz(5)];
    const result = getSabqiRange(5, memorized, 2);
    expect(result.map(j => j.juz)).toEqual([3, 4]);
  });

  it('returns correct window for level 1 (1 juz window)', () => {
    const memorized = [makeJuz(1), makeJuz(2), makeJuz(3)];
    const result = getSabqiRange(3, memorized, 1);
    expect(result.map(j => j.juz)).toEqual([2]);
  });

  it('returns correct window for level 3 (3 juz window)', () => {
    const memorized = [makeJuz(1), makeJuz(2), makeJuz(3), makeJuz(4), makeJuz(5), makeJuz(6), makeJuz(7), makeJuz(8), makeJuz(9), makeJuz(10)];
    const result = getSabqiRange(10, memorized, 3);
    expect(result.map(j => j.juz)).toEqual([7, 8, 9]);
  });

  it('handles non-contiguous juz', () => {
    const memorized = [makeJuz(1), makeJuz(2), makeJuz(28), makeJuz(29), makeJuz(30)];
    const result = getSabqiRange(30, memorized, 2);
    // Window of 2 behind juz 30: [28, 29]
    expect(result.map(j => j.juz)).toEqual([28, 29]);
  });

  it('returns empty when no currentSabaqJuz', () => {
    const memorized = [makeJuz(1), makeJuz(2)];
    const result = getSabqiRange(null, memorized, 1);
    expect(result).toEqual([]);
  });

  it('returns empty when currentSabaqJuz is the only memorized juz', () => {
    const memorized = [makeJuz(1)];
    const result = getSabqiRange(1, memorized, 1);
    expect(result).toEqual([]);
  });

  it('returns available juz if fewer than window size', () => {
    const memorized = [makeJuz(1), makeJuz(2)];
    // Level 2 wants 2 juz window, but only 1 is behind currentSabaq
    const result = getSabqiRange(2, memorized, 2);
    expect(result.map(j => j.juz)).toEqual([1]);
  });
});

describe('distributeSabqiWeekly', () => {
  it('distributes sabqi juz across active days', () => {
    const sabqi = [makeJuz(3), makeJuz(4)];
    const distribution = distributeSabqiWeekly(sabqi, 5, 2);
    // Should have entries for some days
    expect(distribution.size).toBeGreaterThan(0);
    // Each day should have assignments
    for (const [, assignments] of distribution) {
      expect(assignments.length).toBeGreaterThan(0);
      assignments.forEach(a => {
        expect(a.startPage).toBeGreaterThanOrEqual(1);
        expect(a.endPage).toBeLessThanOrEqual(20);
      });
    }
  });

  it('returns empty map for empty sabqi', () => {
    const distribution = distributeSabqiWeekly([], 5, 2);
    expect(distribution.size).toBe(0);
  });

  it('covers all sabqi pages across the week', () => {
    const sabqi = [makeJuz(3)];
    const distribution = distributeSabqiWeekly(sabqi, 5, 2);
    // Sum all pages across all days
    let totalPages = 0;
    for (const [, assignments] of distribution) {
      for (const a of assignments) {
        totalPages += a.endPage - a.startPage + 1;
      }
    }
    expect(totalPages).toBe(20); // Full juz reviewed per week
  });
});

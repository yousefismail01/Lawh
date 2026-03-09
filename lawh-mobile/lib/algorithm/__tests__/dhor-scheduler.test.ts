import { generateDhorCycle, getDhorAssignment } from '../dhor-scheduler';
import type { MemorizedJuz, DhorCycle } from '../types';
import { MAX_DHOR_PAGES_PER_DAY } from '../types';

function makeJuz(juz: number, avgQuality = 4.0, lastReviewed = '2026-01-01'): MemorizedJuz {
  return { juz, pages: 20, avgQuality, lastReviewed, lapses: 0 };
}

describe('generateDhorCycle', () => {
  it('returns empty cycle for empty memorized juz', () => {
    const cycle = generateDhorCycle([], 1);
    expect(cycle.entries).toHaveLength(0);
    expect(cycle.cycleLengthDays).toBe(0);
  });

  it('generates cycle for single juz', () => {
    const cycle = generateDhorCycle([makeJuz(1)], 1);
    expect(cycle.entries.length).toBeGreaterThan(0);
    expect(cycle.cycleLengthDays).toBeGreaterThan(0);
    // All entries should be juz 1
    cycle.entries.forEach(e => expect(e.juz).toBe(1));
  });

  it('prioritizes weak juz (quality < 3.0) with high priority', () => {
    const juz = [
      makeJuz(1, 4.5),
      makeJuz(2, 2.5), // weak
      makeJuz(3, 4.0),
    ];
    const cycle = generateDhorCycle(juz, 1);
    const highPriority = cycle.entries.filter(e => e.priority === 'high');
    expect(highPriority.length).toBeGreaterThan(0);
    // All high-priority entries should be juz 2
    highPriority.forEach(e => expect(e.juz).toBe(2));
  });

  it('weak juz appear approximately 2x in rotation', () => {
    const juz = [
      makeJuz(1, 4.0),
      makeJuz(2, 2.0), // weak — should appear 2x
    ];
    const cycle = generateDhorCycle(juz, 1);
    const juz1Entries = cycle.entries.filter(e => e.juz === 1);
    const juz2Entries = cycle.entries.filter(e => e.juz === 2);
    // Juz 2 should have roughly 2x the page coverage of juz 1
    const juz1Pages = juz1Entries.reduce((s, e) => s + (e.endPage - e.startPage + 1), 0);
    const juz2Pages = juz2Entries.reduce((s, e) => s + (e.endPage - e.startPage + 1), 0);
    expect(juz2Pages).toBeGreaterThan(juz1Pages);
  });

  it('handles non-contiguous juz arrays', () => {
    const juz = [makeJuz(1), makeJuz(2), makeJuz(28), makeJuz(29), makeJuz(30)];
    const cycle = generateDhorCycle(juz, 2);
    expect(cycle.entries.length).toBeGreaterThan(0);
    const juzNumbers = new Set(cycle.entries.map(e => e.juz));
    expect(juzNumbers).toContain(1);
    expect(juzNumbers).toContain(28);
    expect(juzNumbers).toContain(30);
  });

  it('cycle length increases with more juz', () => {
    const small = generateDhorCycle([makeJuz(1), makeJuz(2)], 2);
    const large = generateDhorCycle(
      [makeJuz(1), makeJuz(2), makeJuz(3), makeJuz(4), makeJuz(5)],
      2,
    );
    expect(large.cycleLengthDays).toBeGreaterThan(small.cycleLengthDays);
  });
});

describe('getDhorAssignment', () => {
  it('returns entries for a given day number', () => {
    const juz = [makeJuz(1), makeJuz(2), makeJuz(3)];
    const cycle = generateDhorCycle(juz, 1);
    const assignment = getDhorAssignment(cycle, 0);
    expect(assignment.length).toBeGreaterThan(0);
    assignment.forEach(e => {
      expect(e.startPage).toBeGreaterThanOrEqual(1);
      expect(e.endPage).toBeLessThanOrEqual(20);
      expect(e.endPage).toBeGreaterThanOrEqual(e.startPage);
    });
  });

  it('wraps around using modulo for day numbers beyond cycle length', () => {
    const cycle = generateDhorCycle([makeJuz(1)], 1);
    const day0 = getDhorAssignment(cycle, 0);
    const dayWrapped = getDhorAssignment(cycle, cycle.cycleLengthDays);
    expect(dayWrapped).toEqual(day0);
  });

  it('caps total pages at 20 per day', () => {
    const manyJuz = Array.from({ length: 10 }, (_, i) => makeJuz(i + 1));
    const cycle = generateDhorCycle(manyJuz, 3);
    for (let day = 0; day < cycle.cycleLengthDays; day++) {
      const assignment = getDhorAssignment(cycle, day);
      const totalPages = assignment.reduce((s, e) => s + (e.endPage - e.startPage + 1), 0);
      expect(totalPages).toBeLessThanOrEqual(MAX_DHOR_PAGES_PER_DAY);
    }
  });

  it('returns empty array for empty cycle', () => {
    const cycle: DhorCycle = { entries: [], cycleLengthDays: 0 };
    const assignment = getDhorAssignment(cycle, 0);
    expect(assignment).toEqual([]);
  });
});

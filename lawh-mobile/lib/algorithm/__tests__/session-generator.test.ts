import { generateDailySession } from '../session-generator';
import { generateDhorCycle } from '../dhor-scheduler';
import type { StudentState, MemorizedJuz, DhorCycle } from '../types';
import { MAX_DHOR_PAGES_PER_DAY } from '../types';

function makeJuz(juz: number, avgQuality = 4.0): MemorizedJuz {
  return { juz, pages: 20, avgQuality, lastReviewed: '2026-01-01', lapses: 0 };
}

function makeStudentState(overrides: Partial<StudentState> = {}): StudentState {
  return {
    memorizedJuz: [makeJuz(1), makeJuz(2), makeJuz(3)],
    currentSabaqJuz: 4,
    currentSabaqPage: 5,
    activeDaysPerWeek: 6,
    totalPagesMemorized: 60,
    ...overrides,
  };
}

describe('generateDailySession', () => {
  let state: StudentState;
  let cycle: DhorCycle;

  beforeEach(() => {
    state = makeStudentState();
    cycle = generateDhorCycle(state.memorizedJuz, 1);
  });

  it('combines sabaq + sabqi + dhor on active day', () => {
    const session = generateDailySession(state, cycle, 0, 1, true, 4.0, 0, '2026-03-01');
    expect(session.sabaq).not.toBeNull();
    expect(session.dhor.length).toBeGreaterThan(0);
    expect(session.sessionDate).toBe('2026-03-01');
    expect(session.totalPages).toBeGreaterThan(0);
  });

  it('returns dhor-only reduced session on non-active day', () => {
    const session = generateDailySession(state, cycle, 0, 6, false, 4.0, 0, '2026-03-01');
    expect(session.sabaq).toBeNull();
    expect(session.sabqi).toEqual([]);
    expect(session.dhor.length).toBeGreaterThan(0);
  });

  it('pauses sabaq when dhor quality drops', () => {
    const session = generateDailySession(state, cycle, 0, 1, true, 2.0, 0, '2026-03-01');
    expect(session.sabaq).toBeNull();
    expect(session.dhor.length).toBeGreaterThan(0);
  });

  it('returns sabaq-only for student with 0 memorized juz', () => {
    const newState = makeStudentState({
      memorizedJuz: [],
      currentSabaqJuz: 1,
      currentSabaqPage: 1,
      totalPagesMemorized: 0,
    });
    const emptyCycle = generateDhorCycle([], 1);
    const session = generateDailySession(newState, emptyCycle, 0, 1, true, 0, 0, '2026-03-01');
    expect(session.sabaq).not.toBeNull();
    expect(session.dhor).toEqual([]);
    expect(session.sabqi).toEqual([]);
  });

  it('respects page cap on totalPages', () => {
    const manyJuz = Array.from({ length: 15 }, (_, i) => makeJuz(i + 1));
    const bigState = makeStudentState({
      memorizedJuz: manyJuz,
      totalPagesMemorized: 300,
      currentSabaqJuz: 16,
    });
    const bigCycle = generateDhorCycle(manyJuz, 3);
    const session = generateDailySession(bigState, bigCycle, 0, 1, true, 4.0, 0, '2026-03-01');
    // Total pages should be reasonable (not exceed cap)
    expect(session.totalPages).toBeLessThanOrEqual(MAX_DHOR_PAGES_PER_DAY + 15); // dhor cap + sabqi + sabaq
  });

  it('includes sessionDate in output', () => {
    const session = generateDailySession(state, cycle, 0, 1, true, 4.0, 0, '2026-03-09');
    expect(session.sessionDate).toBe('2026-03-09');
  });
});

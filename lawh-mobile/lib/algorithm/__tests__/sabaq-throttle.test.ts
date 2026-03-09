import { shouldThrottleSabaq, getSabaqAllowance } from '../sabaq-throttle';
import type { StudentState, MemorizedJuz } from '../types';

function makeJuz(juz: number, avgQuality = 4.0): MemorizedJuz {
  return { juz, pages: 20, avgQuality, lastReviewed: '2026-01-01', lapses: 0 };
}

function makeStudentState(overrides: Partial<StudentState> = {}): StudentState {
  return {
    memorizedJuz: [makeJuz(1), makeJuz(2)],
    currentSabaqJuz: 3,
    currentSabaqPage: 1,
    activeDaysPerWeek: 6,
    totalPagesMemorized: 40,
    ...overrides,
  };
}

describe('shouldThrottleSabaq', () => {
  it('returns false when dhor quality is good', () => {
    expect(shouldThrottleSabaq(4.0, 0)).toBe(false);
  });

  it('returns true when dhor avg quality below 3.0', () => {
    expect(shouldThrottleSabaq(2.5, 0)).toBe(true);
  });

  it('returns true when consecutive weak dhor days >= 3', () => {
    expect(shouldThrottleSabaq(3.5, 3)).toBe(true);
  });

  it('returns false at exactly 3.0 quality and 0 weak days', () => {
    expect(shouldThrottleSabaq(3.0, 0)).toBe(false);
  });

  it('returns true at exactly 3.0 quality but 3 consecutive weak days', () => {
    expect(shouldThrottleSabaq(3.0, 3)).toBe(true);
  });
});

describe('getSabaqAllowance', () => {
  it('allows sabaq when quality is stable', () => {
    const state = makeStudentState();
    const result = getSabaqAllowance(state, 2, 4.0, 0);
    expect(result.allowed).toBe(true);
    expect(result.pagesAllowed).toBe(1); // Level 2 = 1 page/day
    expect(result.reason).toBeTruthy();
  });

  it('blocks sabaq when dhor quality drops', () => {
    const state = makeStudentState();
    const result = getSabaqAllowance(state, 2, 2.5, 0);
    expect(result.allowed).toBe(false);
    expect(result.pagesAllowed).toBe(0);
    expect(result.reason).toContain('quality');
  });

  it('blocks sabaq for level 5 (no new memorization)', () => {
    const state = makeStudentState({
      memorizedJuz: Array.from({ length: 28 }, (_, i) => makeJuz(i + 1)),
      totalPagesMemorized: 560,
    });
    const result = getSabaqAllowance(state, 5, 4.5, 0);
    expect(result.allowed).toBe(false);
    expect(result.pagesAllowed).toBe(0);
  });

  it('returns level-appropriate page allowance for level 3', () => {
    const state = makeStudentState({
      memorizedJuz: Array.from({ length: 10 }, (_, i) => makeJuz(i + 1)),
      totalPagesMemorized: 200,
    });
    const result = getSabaqAllowance(state, 3, 4.0, 0);
    expect(result.allowed).toBe(true);
    expect(result.pagesAllowed).toBe(0.75);
  });

  it('blocks when no currentSabaqJuz', () => {
    const state = makeStudentState({ currentSabaqJuz: null });
    const result = getSabaqAllowance(state, 2, 4.0, 0);
    expect(result.allowed).toBe(false);
    expect(result.pagesAllowed).toBe(0);
  });
});

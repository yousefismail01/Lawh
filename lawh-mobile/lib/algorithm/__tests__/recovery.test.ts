import { generateRecoveryPlan } from '../recovery';
import { generateDhorCycle } from '../dhor-scheduler';
import type { StudentState, MemorizedJuz } from '../types';

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

describe('generateRecoveryPlan', () => {
  it('generates catch-up plan for 3 missed days', () => {
    const state = makeStudentState();
    const cycle = generateDhorCycle(state.memorizedJuz, 1);
    const plan = generateRecoveryPlan(3, state, cycle, '2026-03-01');
    expect(plan.missedDays).toBe(3);
    expect(plan.catchUpDays).toBe(Math.ceil(3 * 1.5)); // 5 days
    expect(plan.dailySessions.length).toBe(plan.catchUpDays);
  });

  it('clamps missed days to max 7', () => {
    const state = makeStudentState();
    const cycle = generateDhorCycle(state.memorizedJuz, 1);
    const plan = generateRecoveryPlan(14, state, cycle, '2026-03-01');
    expect(plan.missedDays).toBe(7);
  });

  it('pauses sabaq during recovery', () => {
    const state = makeStudentState();
    const cycle = generateDhorCycle(state.memorizedJuz, 1);
    const plan = generateRecoveryPlan(3, state, cycle, '2026-03-01');
    plan.dailySessions.forEach(session => {
      expect(session.sabaq).toBeNull();
    });
  });

  it('each recovery session has dhor assignments', () => {
    const state = makeStudentState();
    const cycle = generateDhorCycle(state.memorizedJuz, 1);
    const plan = generateRecoveryPlan(2, state, cycle, '2026-03-01');
    plan.dailySessions.forEach(session => {
      expect(session.dhor.length).toBeGreaterThan(0);
    });
  });

  it('handles 1 missed day', () => {
    const state = makeStudentState();
    const cycle = generateDhorCycle(state.memorizedJuz, 1);
    const plan = generateRecoveryPlan(1, state, cycle, '2026-03-01');
    expect(plan.missedDays).toBe(1);
    expect(plan.catchUpDays).toBe(2); // ceil(1 * 1.5) = 2
    expect(plan.dailySessions.length).toBe(2);
  });

  it('handles 0 missed days gracefully', () => {
    const state = makeStudentState();
    const cycle = generateDhorCycle(state.memorizedJuz, 1);
    const plan = generateRecoveryPlan(0, state, cycle, '2026-03-01');
    expect(plan.missedDays).toBe(0);
    expect(plan.catchUpDays).toBe(0);
    expect(plan.dailySessions).toEqual([]);
  });

  it('recovery sessions have sequential dates', () => {
    const state = makeStudentState();
    const cycle = generateDhorCycle(state.memorizedJuz, 1);
    const plan = generateRecoveryPlan(3, state, cycle, '2026-03-01');
    for (let i = 1; i < plan.dailySessions.length; i++) {
      const prev = new Date(plan.dailySessions[i - 1].sessionDate);
      const curr = new Date(plan.dailySessions[i].sessionDate);
      expect(curr.getTime()).toBeGreaterThan(prev.getTime());
    }
  });
});

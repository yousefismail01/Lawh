import { getStudentLevel, getLevelConfig } from '../level-calculator';
import type { StudentLevel, LevelConfig } from '../types';

describe('getStudentLevel', () => {
  it('returns level 1 for 1-3 juz', () => {
    expect(getStudentLevel(1)).toBe(1);
    expect(getStudentLevel(2)).toBe(1);
    expect(getStudentLevel(3)).toBe(1);
  });

  it('returns level 2 for 4-7 juz', () => {
    expect(getStudentLevel(4)).toBe(2);
    expect(getStudentLevel(5)).toBe(2);
    expect(getStudentLevel(7)).toBe(2);
  });

  it('returns level 3 for 8-15 juz', () => {
    expect(getStudentLevel(8)).toBe(3);
    expect(getStudentLevel(12)).toBe(3);
    expect(getStudentLevel(15)).toBe(3);
  });

  it('returns level 4 for 16-25 juz', () => {
    expect(getStudentLevel(16)).toBe(4);
    expect(getStudentLevel(20)).toBe(4);
    expect(getStudentLevel(25)).toBe(4);
  });

  it('returns level 5 for 26-30 juz', () => {
    expect(getStudentLevel(26)).toBe(5);
    expect(getStudentLevel(28)).toBe(5);
    expect(getStudentLevel(30)).toBe(5);
  });

  it('handles fractional juz counts', () => {
    expect(getStudentLevel(2.5)).toBe(1);
    expect(getStudentLevel(3.9)).toBe(2);
    expect(getStudentLevel(7.5)).toBe(3);
    expect(getStudentLevel(0.5)).toBe(1);
  });

  it('returns level 1 for 0 juz', () => {
    expect(getStudentLevel(0)).toBe(1);
  });
});

describe('getLevelConfig', () => {
  it('returns correct config for level 1', () => {
    const config = getLevelConfig(1);
    expect(config.sabaqPagesPerDay).toBe(1);
    expect(config.sabqiWindowJuz).toBe(1);
    expect(config.dhorCycleDays).toBe(5);
    expect(config.sessionSplit).toEqual([50, 25, 25]);
  });

  it('returns correct config for level 2', () => {
    const config = getLevelConfig(2);
    expect(config.sabaqPagesPerDay).toBe(1);
    expect(config.sabqiWindowJuz).toBe(2);
    expect(config.dhorCycleDays).toBe(14);
    expect(config.sessionSplit).toEqual([40, 30, 30]);
  });

  it('returns correct config for level 3', () => {
    const config = getLevelConfig(3);
    expect(config.sabaqPagesPerDay).toBe(0.75);
    expect(config.sabqiWindowJuz).toBe(3);
    expect(config.dhorCycleDays).toBe(42);
    expect(config.sessionSplit).toEqual([30, 30, 40]);
  });

  it('returns correct config for level 4', () => {
    const config = getLevelConfig(4);
    expect(config.sabaqPagesPerDay).toBe(0.5);
    expect(config.sabqiWindowJuz).toBe(3);
    expect(config.dhorCycleDays).toBe(56);
    expect(config.sessionSplit).toEqual([20, 30, 50]);
  });

  it('returns correct config for level 5', () => {
    const config = getLevelConfig(5);
    expect(config.sabaqPagesPerDay).toBe(0);
    expect(config.sabqiWindowJuz).toBe(3);
    expect(config.dhorCycleDays).toBe(10);
    expect(config.sessionSplit).toEqual([0, 20, 80]);
  });

  it('all levels have valid activeDaysPerWeek', () => {
    for (let level = 1; level <= 5; level++) {
      const config = getLevelConfig(level as StudentLevel);
      expect(config.activeDaysPerWeek).toBeGreaterThanOrEqual(5);
      expect(config.activeDaysPerWeek).toBeLessThanOrEqual(7);
    }
  });

  it('session split percentages sum to 100', () => {
    for (let level = 1; level <= 5; level++) {
      const config = getLevelConfig(level as StudentLevel);
      const sum = config.sessionSplit[0] + config.sessionSplit[1] + config.sessionSplit[2];
      expect(sum).toBe(100);
    }
  });
});

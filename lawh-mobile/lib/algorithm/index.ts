/**
 * Madinah-method three-tier hifz review algorithm.
 * Public API barrel export.
 *
 * Pure TypeScript — no DB, no UI, no Supabase dependencies.
 */

// Types
export type {
  StudentLevel,
  QualityScore,
  LevelConfig,
  MemorizedJuz,
  StudentState,
  DhorCycleEntry,
  DhorCycle,
  SabqiAssignment,
  SabaqAllowance,
  DailySession,
  RecoveryPlan,
} from './types';

export {
  PAGES_PER_JUZ,
  TOTAL_JUZ,
  TOTAL_PAGES,
  MAX_DHOR_PAGES_PER_DAY,
  QUALITY_THRESHOLD_DHOR,
  QUALITY_THRESHOLD_SABQI,
  MAX_MISSED_DAYS,
} from './types';

// Level calculator
export { getStudentLevel, getLevelConfig } from './level-calculator';

// Dhor scheduler
export { generateDhorCycle, getDhorAssignment } from './dhor-scheduler';

// Sabqi manager
export { getSabqiRange, distributeSabqiWeekly } from './sabqi-manager';

// Sabaq throttle
export { shouldThrottleSabaq, getSabaqAllowance } from './sabaq-throttle';

// Session generator
export { generateDailySession } from './session-generator';

// Recovery
export { generateRecoveryPlan } from './recovery';

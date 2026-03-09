/**
 * Madinah-method three-tier hifz review algorithm types.
 * Pure TypeScript — no DB, no UI, no Supabase dependencies.
 */

/** Student level 1-5 based on total memorized juz */
export type StudentLevel = 1 | 2 | 3 | 4 | 5;

/** Quality rating 1-5 (1=very weak, 5=excellent) */
export type QualityScore = 1 | 2 | 3 | 4 | 5;

/** Configuration for a given student level */
export interface LevelConfig {
  /** Number of juz in sabqi sliding window */
  sabqiWindowJuz: number;
  /** Pages of dhor per active day */
  dhorPagesPerDay: number;
  /** Pages of sabaq (new memorization) per day */
  sabaqPagesPerDay: number;
  /** Total dhor cycle length in days */
  dhorCycleDays: number;
  /** Expected active study days per week */
  activeDaysPerWeek: number;
  /** Session split percentages [sabaq, sabqi, dhor] */
  sessionSplit: [number, number, number];
}

/** A memorized juz with review metadata */
export interface MemorizedJuz {
  /** Juz number (1-30) */
  juz: number;
  /** Number of pages memorized in this juz (max 20) */
  pages: number;
  /** Average quality score from recent reviews */
  avgQuality: number;
  /** ISO date string of last review */
  lastReviewed: string;
  /** Number of times quality dropped below threshold */
  lapses: number;
}

/** Current state of a student's memorization */
export interface StudentState {
  /** All memorized juz with metadata */
  memorizedJuz: MemorizedJuz[];
  /** Current juz being memorized (sabaq), null if review-only */
  currentSabaqJuz: number | null;
  /** Current page within the sabaq juz */
  currentSabaqPage: number;
  /** Number of active study days per week */
  activeDaysPerWeek: number;
  /** Total pages memorized across all juz */
  totalPagesMemorized: number;
  /** User override for sabaq pages per day (0.5 increments). null = use level default */
  sabaqPagesOverride?: number | null;
  /** Specific surah IDs the user has marked as memorized (for partial-juz filtering) */
  memorizedSurahIds?: number[];
}

/** A single entry in the dhor rotation cycle */
export interface DhorCycleEntry {
  /** Juz number */
  juz: number;
  /** Start page within the juz (1-20) */
  startPage: number;
  /** End page within the juz (1-20) */
  endPage: number;
  /** Priority level — 'high' for weak juz */
  priority: 'normal' | 'high';
}

/** Complete dhor rotation cycle */
export interface DhorCycle {
  /** Ordered list of daily assignments */
  entries: DhorCycleEntry[];
  /** Total number of days in the cycle */
  cycleLengthDays: number;
}

/** Sabqi (recent review) assignment for a day */
export interface SabqiAssignment {
  /** Juz number */
  juz: number;
  /** Start page within the juz (1-20) */
  startPage: number;
  /** End page within the juz (1-20) */
  endPage: number;
}

/** Whether new memorization (sabaq) is allowed */
export interface SabaqAllowance {
  /** Whether sabaq is permitted */
  allowed: boolean;
  /** Number of pages allowed (0 if not allowed) */
  pagesAllowed: number;
  /** Human-readable reason for the decision */
  reason: string;
}

/** A complete daily session combining all three tiers */
export interface DailySession {
  /** New memorization assignment, null if paused/throttled */
  sabaq: { juz: number; startPage: number; endPage: number } | null;
  /** Recent review assignments */
  sabqi: SabqiAssignment[];
  /** Revision rotation assignments */
  dhor: DhorCycleEntry[];
  /** Total pages across all tiers */
  totalPages: number;
  /** ISO date string for this session */
  sessionDate: string;
}

/** Recovery plan for missed days */
export interface RecoveryPlan {
  /** Number of days missed (clamped to 7) */
  missedDays: number;
  /** Number of catch-up days generated */
  catchUpDays: number;
  /** Generated catch-up sessions */
  dailySessions: DailySession[];
}

/** Constants */
export const PAGES_PER_JUZ = 20;
export const TOTAL_JUZ = 30;
export const TOTAL_PAGES = 604;
export const MAX_DHOR_PAGES_PER_DAY = 20;
export const QUALITY_THRESHOLD_DHOR = 3.0;
export const QUALITY_THRESHOLD_SABQI = 3.5;
export const MAX_MISSED_DAYS = 7;

/** Position of an ayah within a mushaf page's 15-line grid */
export interface AyahLineRange {
  surahId: number;
  ayahNumber: number;
  lineStart: number;  // 1-15
  lineEnd: number;    // 1-15
  lineCount: number;
}

/** Layout of a single mushaf page with ayah positions */
export interface PageAyahLayout {
  page: number;
  ayahs: AyahLineRange[];
  /** Number of non-ayah header lines (surah_name + basmallah) */
  headerLines: number;
  /** Total ayah-content lines (15 minus headers) */
  contentLines: number;
}

/** A concrete memorization unit bounded by ayah numbers */
export interface MemorizationUnit {
  surahId: number;
  surahName: string;
  startAyah: number;
  endAyah: number;
  /** Mushaf page this unit is on */
  mushafPage: number;
  /** 0 = first half, 1 = second half */
  halfIndex: 0 | 1;
  /** Number of actual content lines */
  lineCount: number;
  /** True if a single ayah spans >10 lines */
  isLongAyah: boolean;
}

/** Ayah boundary snapping mode */
export type AyahBoundaryMode = 'round_down' | 'round_up';

/** Half-page settings for the memorization algorithm */
export interface HalfPageSettings {
  ayahBoundaryMode: AyahBoundaryMode;
  /** Number of half-pages to memorize per day */
  dailyHalfPages: number;
}

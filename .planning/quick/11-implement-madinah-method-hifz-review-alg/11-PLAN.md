---
phase: quick-11
plan: 01
type: tdd
wave: 1
depends_on: []
files_modified:
  - lawh-mobile/lib/algorithm/types.ts
  - lawh-mobile/lib/algorithm/level-calculator.ts
  - lawh-mobile/lib/algorithm/dhor-scheduler.ts
  - lawh-mobile/lib/algorithm/sabqi-manager.ts
  - lawh-mobile/lib/algorithm/sabaq-throttle.ts
  - lawh-mobile/lib/algorithm/session-generator.ts
  - lawh-mobile/lib/algorithm/recovery.ts
  - lawh-mobile/lib/algorithm/index.ts
  - lawh-mobile/lib/algorithm/__tests__/level-calculator.test.ts
  - lawh-mobile/lib/algorithm/__tests__/dhor-scheduler.test.ts
  - lawh-mobile/lib/algorithm/__tests__/sabqi-manager.test.ts
  - lawh-mobile/lib/algorithm/__tests__/sabaq-throttle.test.ts
  - lawh-mobile/lib/algorithm/__tests__/session-generator.test.ts
  - lawh-mobile/lib/algorithm/__tests__/recovery.test.ts
autonomous: true
requirements: [MADINAH-ALGO]

must_haves:
  truths:
    - "Level calculator returns correct level (1-5) for any juz count including fractional and non-contiguous"
    - "Dhor scheduler produces a rotation cycle covering all memorized juz with priority weighting"
    - "Sabqi manager returns correct sliding window of 1-3 juz behind current position"
    - "Sabaq throttle auto-pauses new memorization when dhor quality drops below threshold"
    - "Session generator combines sabaq + sabqi + dhor into a capped daily session"
    - "Recovery system produces catch-up plans for missed days without overwhelming the student"
  artifacts:
    - path: "lawh-mobile/lib/algorithm/types.ts"
      provides: "All TypeScript interfaces for the Madinah method algorithm"
    - path: "lawh-mobile/lib/algorithm/level-calculator.ts"
      provides: "Student level determination (5 tiers based on memorized juz)"
      exports: ["getStudentLevel", "getLevelConfig"]
    - path: "lawh-mobile/lib/algorithm/dhor-scheduler.ts"
      provides: "Dhor cycle calculation with priority rotation"
      exports: ["generateDhorCycle", "getDhorAssignment"]
    - path: "lawh-mobile/lib/algorithm/sabqi-manager.ts"
      provides: "Sabqi sliding window management"
      exports: ["getSabqiRange", "distributeSabqiWeekly"]
    - path: "lawh-mobile/lib/algorithm/sabaq-throttle.ts"
      provides: "Sabaq allowance with auto-throttling"
      exports: ["getSabaqAllowance", "shouldThrottleSabaq"]
    - path: "lawh-mobile/lib/algorithm/session-generator.ts"
      provides: "Daily session generator combining all three tiers"
      exports: ["generateDailySession"]
    - path: "lawh-mobile/lib/algorithm/recovery.ts"
      provides: "Missed day recovery plans"
      exports: ["generateRecoveryPlan"]
    - path: "lawh-mobile/lib/algorithm/index.ts"
      provides: "Public API barrel export"
  key_links:
    - from: "lawh-mobile/lib/algorithm/session-generator.ts"
      to: "lawh-mobile/lib/algorithm/level-calculator.ts"
      via: "getStudentLevel() determines all scaling parameters"
      pattern: "getStudentLevel"
    - from: "lawh-mobile/lib/algorithm/session-generator.ts"
      to: "lawh-mobile/lib/algorithm/dhor-scheduler.ts"
      via: "getDhorAssignment() provides today's dhor pages"
      pattern: "getDhorAssignment"
    - from: "lawh-mobile/lib/algorithm/sabaq-throttle.ts"
      to: "lawh-mobile/lib/algorithm/dhor-scheduler.ts"
      via: "Checks avg dhor quality to decide throttling"
      pattern: "dhorQuality|avgQuality"
---

<objective>
Implement the Madinah-method three-tier hifz review algorithm as pure TypeScript functions.

Purpose: Replace the current flat volume-based rotation with the traditional Madinah hifz methodology (Sabaq/Sabqi/Dhor) that scales review load based on total memorized volume, prioritizes weak juz in dhor cycles, and auto-throttles new memorization when revision quality drops.

Output: 8 TypeScript files in `lawh-mobile/lib/algorithm/` with full test coverage. Pure business logic -- no DB, no UI, no Supabase dependencies.
</objective>

<execution_context>
@/Users/yousef/.claude/get-shit-done/workflows/execute-plan.md
@/Users/yousef/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lawh-mobile/lib/sr/types.ts
@lawh-mobile/lib/sr/sm2plus.ts
@lawh-mobile/lib/data/juzBoundaries.ts
@lawh-mobile/services/hifzService.ts

<interfaces>
<!-- Existing types the algorithm will reference (but not import -- algorithm is pure) -->

From lawh-mobile/lib/sr/types.ts:
```typescript
export type Grade = 0 | 2 | 3 | 5
export type HifzStatus = 'not_started' | 'in_progress' | 'memorized' | 'needs_review'
```

From lawh-mobile/lib/data/juzBoundaries.ts:
```typescript
export interface JuzBoundary { juz: number; surahId: number; ayahNumber: number }
export const JUZ_BOUNDARIES: JuzBoundary[] // 30 entries, one per juz start
export function getJuzForAyah(surahId: number, ayahNumber: number): number
```

Constants:
- 604 pages in Madinah mushaf
- 20 pages per juz
- 30 juz total
- Quality ratings 1-5 (1=very weak, 5=excellent)
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Define type contracts and implement level calculator + dhor scheduler</name>
  <files>
    lawh-mobile/lib/algorithm/types.ts,
    lawh-mobile/lib/algorithm/level-calculator.ts,
    lawh-mobile/lib/algorithm/dhor-scheduler.ts,
    lawh-mobile/lib/algorithm/__tests__/level-calculator.test.ts,
    lawh-mobile/lib/algorithm/__tests__/dhor-scheduler.test.ts
  </files>
  <behavior>
    Level Calculator:
    - getStudentLevel({memorizedJuz: 2}) => level 1 (1-3 juz range)
    - getStudentLevel({memorizedJuz: 5}) => level 2 (4-7 juz range)
    - getStudentLevel({memorizedJuz: 12}) => level 3 (8-15 juz range)
    - getStudentLevel({memorizedJuz: 20}) => level 4 (16-25 juz range)
    - getStudentLevel({memorizedJuz: 28}) => level 5 (26-30 juz range)
    - getStudentLevel({memorizedJuz: 2.5}) => level 1 (fractional juz handled)
    - getLevelConfig(level) returns { sabqiWindowJuz, dhorPagesPerDay, sabaqPagesPerDay, dhorCycleDays, activeDaysPerWeek }
    - Level 1: sabqi=1 juz, dhor=2 pages/day, sabaq=1 page/day, cycle=7 days
    - Level 5: sabqi=3 juz, dhor=20 pages/day, sabaq=0.5 page/day, cycle=30 days

    Dhor Scheduler:
    - generateDhorCycle({memorizedJuz: [1,2,3], qualityScores: {1: 3.2, 2: 4.1, 3: 2.5}, level: 1}) => ordered rotation with juz 3 (weakest) appearing more frequently
    - getDhorAssignment({cycle, dayNumber: 0, pagesPerDay: 2}) => {juz: 3, startPage: 1, endPage: 2} (weakest first)
    - getDhorAssignment for non-contiguous memorization (e.g., juz [1,2,28,29,30]) works correctly
    - Daily page cap of 20 pages is enforced regardless of level
    - Empty memorized juz array returns empty cycle
    - Priority weighting: juz with quality < 3.0 appear 2x in rotation
  </behavior>
  <action>
    1. Create `types.ts` with ALL algorithm interfaces:
       - `StudentLevel` (1-5 enum-like type)
       - `LevelConfig` { sabqiWindowJuz: number, dhorPagesPerDay: number, sabaqPagesPerDay: number, dhorCycleDays: number, activeDaysPerWeek: number }
       - `MemorizedJuz` { juz: number, pages: number, avgQuality: number, lastReviewed: string }
       - `StudentState` { memorizedJuz: MemorizedJuz[], currentSabaqJuz: number | null, currentSabaqPage: number, activeDaysPerWeek: number, totalPagesMemorized: number }
       - `DhorCycleEntry` { juz: number, startPage: number, endPage: number, priority: 'normal' | 'high' }
       - `DhorCycle` { entries: DhorCycleEntry[], cycleLengthDays: number }
       - `SabqiAssignment` { juz: number, startPage: number, endPage: number }
       - `SabaqAllowance` { allowed: boolean, pagesAllowed: number, reason: string }
       - `DailySession` { sabaq: { juz: number, startPage: number, endPage: number } | null, sabqi: SabqiAssignment[], dhor: DhorCycleEntry[], totalPages: number, sessionDate: string }
       - `RecoveryPlan` { missedDays: number, catchUpDays: number, dailySessions: DailySession[] }
       - `QualityScore` (number 1-5)

    2. Create `level-calculator.ts`:
       - `getStudentLevel(totalJuz: number): StudentLevel` -- thresholds: <=3 => 1, <=7 => 2, <=15 => 3, <=25 => 4, else 5
       - `getLevelConfig(level: StudentLevel): LevelConfig` -- lookup table with the 5 level configs
       - All inputs are plain numbers/objects, no DB dependencies

    3. Create `dhor-scheduler.ts`:
       - `generateDhorCycle(memorizedJuz: MemorizedJuz[], level: StudentLevel): DhorCycle`
         - Sorts juz by quality ascending (weakest first)
         - Juz with avgQuality < 3.0 get 'high' priority and appear 2x in the rotation
         - Splits each juz's 20 pages into daily chunks based on getLevelConfig(level).dhorPagesPerDay
         - Total cycle length = sum of all daily assignments
       - `getDhorAssignment(cycle: DhorCycle, dayNumber: number): DhorCycleEntry[]`
         - Returns entries for dayNumber (mod cycle length)
         - Caps at 20 pages total per day
       - Handle non-contiguous juz arrays (e.g., [1, 2, 28, 29, 30])
       - Handle empty arrays (return empty cycle)

    4. Write tests FIRST (RED), then implement (GREEN). Use `npx jest` with ts-jest or the project's existing test runner. Check `package.json` for test config.
  </action>
  <verify>
    <automated>cd /Users/yousef/Documents/Projects/Lawh/lawh-mobile && npx jest lib/algorithm/__tests__/level-calculator.test.ts lib/algorithm/__tests__/dhor-scheduler.test.ts --no-cache 2>&1 | tail -20</automated>
  </verify>
  <done>
    - types.ts exports all interfaces needed by the algorithm
    - level-calculator returns correct level for all 5 tiers including fractional juz
    - dhor-scheduler produces priority-weighted rotation cycles
    - dhor assignment respects 20-page daily cap
    - Non-contiguous and empty juz arrays handled
    - All tests pass
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement sabqi manager, sabaq throttle, session generator, and recovery</name>
  <files>
    lawh-mobile/lib/algorithm/sabqi-manager.ts,
    lawh-mobile/lib/algorithm/sabaq-throttle.ts,
    lawh-mobile/lib/algorithm/session-generator.ts,
    lawh-mobile/lib/algorithm/recovery.ts,
    lawh-mobile/lib/algorithm/index.ts,
    lawh-mobile/lib/algorithm/__tests__/sabqi-manager.test.ts,
    lawh-mobile/lib/algorithm/__tests__/sabaq-throttle.test.ts,
    lawh-mobile/lib/algorithm/__tests__/session-generator.test.ts,
    lawh-mobile/lib/algorithm/__tests__/recovery.test.ts
  </files>
  <behavior>
    Sabqi Manager:
    - getSabqiRange({currentSabaqJuz: 5, memorizedJuz: [1,2,3,4,5], level: 2}) => juz [3,4] (sabqi window = 1 juz for level 2... actually check: level 2 sabqi window = 2 juz, so [3,4])
    - getSabqiRange with non-contiguous juz (e.g., currentSabaqJuz: 30, memorized: [1,2,28,29,30]) => correct window behind position
    - getSabqiRange with no currentSabaqJuz (review-only student) => empty
    - distributeSabqiWeekly({sabqiJuz: [3,4], activeDaysPerWeek: 5, level: 2}) => pages distributed across 5 days

    Sabaq Throttle:
    - shouldThrottleSabaq({dhorAvgQuality: 4.0, level: 2}) => false (quality good)
    - shouldThrottleSabaq({dhorAvgQuality: 2.5, level: 2}) => true (quality below 3.0 threshold)
    - getSabaqAllowance({studentState, level}) => { allowed: true, pagesAllowed: 1, reason: 'Dhor quality stable' } or { allowed: false, pagesAllowed: 0, reason: 'Dhor quality below 3.0 - pause new memorization' }

    Session Generator:
    - generateDailySession({studentState, dayOfWeek: 1, dayNumber: 5}) combines sabaq + sabqi + dhor
    - Total pages capped at level-appropriate maximum
    - Dhor gets priority allocation, then sabqi, then sabaq with remaining capacity
    - Rest days (non-active days) return dhor-only reduced session
    - Student with 0 memorized juz gets sabaq-only session

    Recovery:
    - generateRecoveryPlan({missedDays: 3, studentState}) => 3-day catch-up plan
    - Recovery spreads missed dhor across catch-up days (1.5x normal load, never 2x)
    - Recovery caps at 7 missed days (beyond that, just resume normal schedule)
    - Sabaq is paused during recovery
  </behavior>
  <action>
    1. Create `sabqi-manager.ts`:
       - `getSabqiRange(currentSabaqJuz: number | null, memorizedJuz: MemorizedJuz[], level: StudentLevel): MemorizedJuz[]`
         - Window size from getLevelConfig(level).sabqiWindowJuz
         - Looks backward from currentSabaqJuz in the memorizedJuz array
         - Handles non-contiguous: if currentSabaq is juz 30 and memorized is [1,2,28,29,30], window looks at [28,29] (not [28,29,30] since 30 is current sabaq)
         - No currentSabaqJuz => empty array
       - `distributeSabqiWeekly(sabqiJuz: MemorizedJuz[], activeDaysPerWeek: number, level: StudentLevel): Map<number, SabqiAssignment[]>`
         - Distributes sabqi juz pages across active days of the week
         - Each sabqi juz gets reviewed once per week
         - Returns Map<dayOfWeek (0-6), SabqiAssignment[]>

    2. Create `sabaq-throttle.ts`:
       - `shouldThrottleSabaq(dhorAvgQuality: number, consecutiveWeakDhorDays: number): boolean`
         - Returns true if avgQuality < 3.0 OR consecutiveWeakDhorDays >= 3
       - `getSabaqAllowance(studentState: StudentState, level: StudentLevel, dhorAvgQuality: number, consecutiveWeakDhorDays: number): SabaqAllowance`
         - If throttled: { allowed: false, pagesAllowed: 0, reason: '...' }
         - If allowed: { allowed: true, pagesAllowed: getLevelConfig(level).sabaqPagesPerDay, reason: '...' }

    3. Create `session-generator.ts`:
       - `generateDailySession(studentState: StudentState, dhorCycle: DhorCycle, dayNumber: number, dayOfWeek: number, isActiveDay: boolean, dhorAvgQuality: number, consecutiveWeakDhorDays: number, sessionDate: string): DailySession`
         - Priority order: dhor first (always), then sabqi (active days), then sabaq (if allowed and active day)
         - Non-active days: dhor-only at 50% normal volume
         - Combines getDhorAssignment + getSabqiRange + getSabaqAllowance
         - Caps totalPages based on level

    4. Create `recovery.ts`:
       - `generateRecoveryPlan(missedDays: number, studentState: StudentState, dhorCycle: DhorCycle, startDate: string): RecoveryPlan`
         - Clamp missedDays to max 7
         - Catch-up days = ceil(missedDays * 1.5) (extra days to spread load)
         - Each catch-up day: 1.5x normal dhor load, no sabaq, reduced sabqi
         - Generates DailySession[] for the catch-up period

    5. Create `index.ts`:
       - Barrel export of all public functions and types
       - Named exports only (no default exports)

    6. Write ALL tests FIRST (RED), then implement each module (GREEN). Run full test suite to confirm.
  </action>
  <verify>
    <automated>cd /Users/yousef/Documents/Projects/Lawh/lawh-mobile && npx jest lib/algorithm/__tests__/ --no-cache 2>&1 | tail -30</automated>
  </verify>
  <done>
    - sabqi-manager returns correct sliding window for contiguous and non-contiguous memorization
    - sabaq-throttle correctly pauses new memorization when dhor quality drops
    - session-generator produces combined daily sessions with correct priority ordering and page caps
    - recovery produces realistic catch-up plans capped at 7 missed days
    - index.ts exports all public API functions and types
    - ALL algorithm tests pass (level-calculator + dhor-scheduler + sabqi + sabaq + session + recovery)
    - No imports from expo-sqlite, supabase, or any React Native modules -- pure TypeScript
  </done>
</task>

</tasks>

<verification>
```bash
# All algorithm tests pass
cd lawh-mobile && npx jest lib/algorithm/__tests__/ --no-cache

# No external dependencies (no DB, no UI, no Supabase imports)
grep -r "expo-sqlite\|supabase\|react-native\|from 'react'" lib/algorithm/ && echo "FAIL: external imports found" || echo "PASS: pure algorithm"

# TypeScript compiles cleanly
npx tsc --noEmit --project tsconfig.json 2>&1 | grep -c "error" | xargs -I{} test {} -eq 0
```
</verification>

<success_criteria>
- All 8 algorithm files exist in lawh-mobile/lib/algorithm/
- All 6 test files pass with meaningful coverage of edge cases
- Algorithm handles: non-contiguous memorization, fractional juz, empty states, quality-based throttling
- Daily session respects 20-page dhor cap and level-based scaling
- No external dependencies -- pure TypeScript functions
- index.ts provides clean public API barrel export
</success_criteria>

<output>
After completion, create `.planning/quick/11-implement-madinah-method-hifz-review-alg/11-SUMMARY.md`
</output>

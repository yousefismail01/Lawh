---
phase: quick-11
plan: 01
subsystem: algorithm
tags: [hifz, madinah-method, sabaq, sabqi, dhor, spaced-repetition, tdd]

requires:
  - phase: 08-hifz-tracker-and-review-scheduler-with-adaptive-spaced-repetition
    provides: "SM-2+ spaced repetition types and hifz tracking infrastructure"
provides:
  - "Pure TypeScript Madinah-method three-tier hifz review algorithm"
  - "Level calculator with 5-tier student progression"
  - "Dhor rotation scheduler with priority weighting for weak juz"
  - "Sabqi sliding window manager for recent review"
  - "Sabaq throttle with auto-pause on quality drop"
  - "Daily session generator combining all tiers"
  - "Recovery plan generator for missed days"
affects: [hifz-service, review-sessions, hifz-store]

tech-stack:
  added: []
  patterns: [pure-function-algorithm, tdd-red-green, barrel-export]

key-files:
  created:
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
  modified: []

key-decisions:
  - "Pure TypeScript with zero external dependencies — algorithm is fully portable"
  - "Skip quality-based throttle check for new students with no memorized juz"
  - "Weak juz (avgQuality < 3.0) get 2x rotation in dhor cycle with 'high' priority marker"
  - "Recovery plan caps missed days at 7 and spreads 1.5x dhor load across catch-up days"

patterns-established:
  - "Pure function algorithm: all modules take plain data objects and return computed results"
  - "Barrel export pattern: index.ts re-exports all public types and functions"
  - "TDD pattern: tests written first, then minimal implementation to pass"

requirements-completed: [MADINAH-ALGO]

duration: 5min
completed: 2026-03-09
---

# Quick Task 11: Madinah Method Algorithm Summary

**Three-tier hifz review algorithm (Sabaq/Sabqi/Dhor) with 5-level student progression, quality-based throttling, priority-weighted dhor rotation, and missed-day recovery**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-09T03:56:39Z
- **Completed:** 2026-03-09T04:01:35Z
- **Tasks:** 2
- **Files created:** 14

## Accomplishments
- Complete Madinah-method algorithm as 7 pure TypeScript modules + barrel export
- Level calculator correctly maps 0-30 juz (including fractional) to 5 student tiers
- Dhor scheduler produces priority-weighted rotation cycles with weak juz appearing 2x
- Sabaq auto-throttle pauses new memorization when dhor quality drops below 3.0
- Session generator combines all three tiers with correct priority ordering (dhor > sabqi > sabaq)
- Recovery plan handles 0-7 missed days with 1.5x dhor catch-up spread
- 57 tests across 6 test files covering edge cases (non-contiguous juz, fractional, empty state)

## Task Commits

1. **Task 1: Type contracts, level calculator, dhor scheduler** - `ef37b32` (feat)
2. **Task 2: Sabqi manager, sabaq throttle, session generator, recovery** - `5ba8d23` (feat)

## Files Created
- `lawh-mobile/lib/algorithm/types.ts` - All interfaces and constants (StudentLevel, LevelConfig, MemorizedJuz, etc.)
- `lawh-mobile/lib/algorithm/level-calculator.ts` - getStudentLevel() and getLevelConfig() with 5-tier lookup
- `lawh-mobile/lib/algorithm/dhor-scheduler.ts` - generateDhorCycle() and getDhorAssignment() with priority weighting
- `lawh-mobile/lib/algorithm/sabqi-manager.ts` - getSabqiRange() and distributeSabqiWeekly() with non-contiguous support
- `lawh-mobile/lib/algorithm/sabaq-throttle.ts` - shouldThrottleSabaq() and getSabaqAllowance() with quality gating
- `lawh-mobile/lib/algorithm/session-generator.ts` - generateDailySession() combining all three tiers
- `lawh-mobile/lib/algorithm/recovery.ts` - generateRecoveryPlan() for missed day catch-up
- `lawh-mobile/lib/algorithm/index.ts` - Barrel export of all public API

## Decisions Made
- Pure TypeScript with zero external dependencies — algorithm is fully portable and testable
- Skip quality-based throttle for new students with no memorized juz (avoids false positive on 0 quality)
- Weak juz (avgQuality < 3.0) get 2x rotation in dhor cycle with 'high' priority marker for UI highlighting
- Recovery caps missed days at 7 and uses ceil(missedDays * 1.5) catch-up days with no sabaq

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed sabaq throttle false positive for new students**
- **Found during:** Task 2 (session generator tests)
- **Issue:** Student with 0 memorized juz passed dhorAvgQuality=0 which triggered throttle, blocking sabaq for beginners
- **Fix:** Added check to skip quality-based throttle when memorizedJuz is empty
- **Files modified:** lawh-mobile/lib/algorithm/sabaq-throttle.ts
- **Verification:** "returns sabaq-only for student with 0 memorized juz" test passes
- **Committed in:** 5ba8d23 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential correctness fix. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Algorithm ready to be integrated into hifzService and hifzStore
- All functions accept plain data objects — integration layer maps DB entities to algorithm types
- Session generator is the main entry point for daily review scheduling

---
*Quick Task: 11-implement-madinah-method-hifz-review-alg*
*Completed: 2026-03-09*

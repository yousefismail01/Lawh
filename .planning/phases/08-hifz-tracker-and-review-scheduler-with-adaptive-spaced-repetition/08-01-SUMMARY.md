---
phase: 08-hifz-tracker-and-review-scheduler-with-adaptive-spaced-repetition
plan: 01
subsystem: database
tags: [sm2plus, spaced-repetition, sqlite, zustand, typescript, tdd]

requires: []
provides:
  - "SM-2+ pure algorithm function (sm2plus, computeStrength)"
  - "Type contracts (Grade, ReviewCard, SM2Result, HifzStatus, SurahStatus, ReviewQueueItem)"
  - "SQLite hifz service (hifzService) with CRUD for hifz_progress and review_schedule"
  - "Zustand hifzStore with write-through persistence pattern"
affects: [08-02, 08-03, hifz-ui, review-sessions, dashboard-badge]

tech-stack:
  added: []
  patterns:
    - "SM-2+ pure function with injectable today parameter for testability"
    - "UTC-normalized date handling for timezone-safe interval computation"
    - "Write-through persistence: SQLite mutation then Zustand set()"
    - "Lazy SQLite database init via getDb() pattern"

key-files:
  created:
    - lawh-mobile/lib/sr/types.ts
    - lawh-mobile/lib/sr/sm2plus.ts
    - lawh-mobile/lib/sr/sm2plus.test.ts
    - lawh-mobile/services/hifzService.ts
    - lawh-mobile/stores/hifzStore.ts

key-decisions:
  - "UTC-normalized dates in SM-2+ to prevent timezone bugs in interval computation"
  - "Grade type restricted to 0|2|3|5 (not 0-5 range) matching Anki-style 4-button grading"
  - "Strength formula uses denominator 8: min(1.0, (reps * EF) / (reps * EF + 8))"
  - "hifzStore uses no persist middleware -- SQLite is the single source of truth"

patterns-established:
  - "SM-2+ pure function pattern: sm2plus(card, grade, today?) -> SM2Result"
  - "Write-through store pattern: hifzService mutation -> hifzStore.set()"
  - "Multi-riwayah query pattern: all WHERE clauses include AND riwayah = ?"

requirements-completed: [SM2-01, SM2-02, SM2-03, SM2-05]

duration: 5min
completed: 2026-03-08
---

# Phase 8 Plan 01: SM-2+ Algorithm, Hifz Data Layer Summary

**SM-2+ spaced repetition algorithm with TDD (12 tests), SQLite hifz service mirroring Supabase schema, and Zustand store with write-through persistence**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-08T19:53:34Z
- **Completed:** 2026-03-08T19:58:15Z
- **Tasks:** 2
- **Files created:** 5

## Accomplishments
- Pure SM-2+ algorithm with Wozniak EF formula, overdue credit, EF recovery, jitter, min EF 1.3
- 12 unit tests covering all grade paths, edge cases, and strength computation
- SQLite hifz service with lazy init, CREATE TABLE IF NOT EXISTS, indexes, full CRUD
- Zustand hifzStore with write-through persistence (no persist middleware)

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): SM-2+ tests and types** - `748bf39` (test)
2. **Task 1 (GREEN): SM-2+ algorithm implementation** - `c6f02f9` (feat)
3. **Task 2: SQLite hifz service and Zustand store** - `6cebcd3` (feat)

_TDD task had RED and GREEN commits as separate atomic steps._

## Files Created/Modified
- `lawh-mobile/lib/sr/types.ts` - Grade, ReviewCard, SM2Result, HifzStatus, SurahStatus, ReviewQueueItem types
- `lawh-mobile/lib/sr/sm2plus.ts` - Pure SM-2+ algorithm with computeStrength helper
- `lawh-mobile/lib/sr/sm2plus.test.ts` - 12 unit tests for algorithm correctness
- `lawh-mobile/services/hifzService.ts` - SQLite CRUD for hifz_progress and review_schedule tables
- `lawh-mobile/stores/hifzStore.ts` - Zustand store with write-through persistence to SQLite

## Decisions Made
- Used UTC-normalized dates in SM-2+ to prevent timezone bugs (Date objects parsed with T00:00:00Z suffix)
- Restricted Grade type to 0|2|3|5 (not 0-5 range) matching the user decision for 4-button Anki-style grading
- Strength formula denominator set to 8 (vs research example of 5) for smoother progression curve
- hifzStore has no persist middleware -- SQLite is the authoritative persistence layer
- Added consecutive_correct and mistake_count as local-only SQLite columns (not in Supabase schema yet)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] UTC date normalization for timezone safety**
- **Found during:** Task 1 (SM-2+ TDD GREEN phase)
- **Issue:** `new Date('2026-01-01')` creates UTC midnight but `new Date(y, m, d)` creates local timezone midnight, causing due date computation to be off by 1 day in negative UTC offsets
- **Fix:** Normalized all dates to UTC using `toISOString().split('T')[0] + 'T00:00:00Z'` pattern
- **Files modified:** lawh-mobile/lib/sr/sm2plus.ts
- **Verification:** Due date test passes correctly
- **Committed in:** c6f02f9 (GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for correctness. No scope creep.

## Issues Encountered
None beyond the timezone issue documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SM-2+ algorithm fully tested and ready for grading UI
- hifzService provides all CRUD needed by Plan 02 (hifz grid UI) and Plan 03 (review sessions)
- hifzStore provides reactive state for Dashboard badge, Hifz tab grid, and session screens
- Type contracts shared across the entire hifz subsystem

---
*Phase: 08-hifz-tracker-and-review-scheduler-with-adaptive-spaced-repetition*
*Completed: 2026-03-08*

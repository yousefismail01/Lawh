---
phase: 09-level-adaptive-guided-daily-session-ui-with-heatmap-dhor-cycle-tracker-and-session-flow
plan: 02
subsystem: ui
tags: [react-native, zustand, expo-router, haptics, state-machine, guided-session]

requires:
  - phase: 09-01
    provides: "completeSession, QualityRating, MadinahSessionSummary, getMissedDays, session tracking state"
provides:
  - "Guided daily session screen with sabaq->sabqi->dhor state machine"
  - "SessionTierCard component for tier rendering with 3 visual states"
  - "Start Session button on TodaySession card"
  - "Level-adaptive visual weighting on TodaySession tier rows"
  - "Missed day welcome-back banner"
affects: [09-03, 09-04, hifz-dashboard]

tech-stack:
  added: []
  patterns:
    - "State machine via useState for multi-phase guided flows"
    - "Proportional flex weights from algorithm sessionSplit config"
    - "Auto-advance on all-rated check with 500ms visual delay"

key-files:
  created:
    - lawh-mobile/app/(main)/session.tsx
    - lawh-mobile/components/hifz/SessionTierCard.tsx
  modified:
    - lawh-mobile/components/hifz/TodaySession.tsx

key-decisions:
  - "State machine uses useState not a library -- simple enough for 4 phases (sabaq/sabqi/dhor/summary)"
  - "Auto-advance after 500ms delay when all entries in a tier are rated, for visual feedback"
  - "Sabaq completion uses a button (page-based), while sabqi/dhor completion uses QualityRating (quality-based)"
  - "Skip button shown when sabaq is paused to let user continue to next tier"
  - "Proportional flex computed by dividing sessionSplit by smallest non-zero value"

patterns-established:
  - "Guided flow screens use SessionPhase enum with phase transitions"
  - "SessionTierCard reusable across session contexts with 3 visual states"

requirements-completed: [P9-01, P9-02, P9-05, P9-06]

duration: 4min
completed: 2026-03-09
---

# Phase 09 Plan 02: Guided Session Screen Summary

**State-machine guided daily session screen (sabaq->sabqi->dhor) with SessionTierCard, QualityRating integration, and level-adaptive TodaySession card**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-09T04:57:12Z
- **Completed:** 2026-03-09T05:01:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Built guided session screen with linear sabaq->sabqi->dhor->summary flow
- SessionTierCard component handles upcoming/active/completed states with sabaq pause hadith display
- TodaySession card now has Start Session button, level-adaptive tier sizing, and missed day banner

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SessionTierCard component and guided session screen** - `5778650` (feat)
2. **Task 2: Add Start Session button and level-adaptive sizing to TodaySession** - `d6c8bd8` (feat)

## Files Created/Modified
- `lawh-mobile/app/(main)/session.tsx` - Guided session screen with state machine, phase indicator, exit confirmation
- `lawh-mobile/components/hifz/SessionTierCard.tsx` - Tier card with upcoming/active/completed states, QualityRating, sabaq pause
- `lawh-mobile/components/hifz/TodaySession.tsx` - Start Session button, proportional flex weights, missed day banner

## Decisions Made
- State machine uses useState (4 phases: sabaq, sabqi, dhor, summary) -- no library needed
- Auto-advance with 500ms delay when all entries in a tier are rated for visual feedback
- Sabaq uses "Mark Complete" button; sabqi/dhor use QualityRating as the completion signal
- Skip button for paused sabaq to navigate directly to next tier
- Proportional flex weights computed by dividing sessionSplit percentages by smallest non-zero value
- Dominant tier (highest %) gets 3px left border emphasis

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Session screen is navigable and functional for Plans 03/04
- Heatmap and dhor cycle tracker can build on completedSessionDates and sessionHistory data

## Self-Check: PASSED

- All 3 files verified on disk
- Both task commits (5778650, d6c8bd8) verified in git log

---
*Phase: 09-level-adaptive-guided-daily-session-ui-with-heatmap-dhor-cycle-tracker-and-session-flow*
*Completed: 2026-03-09*

---
phase: 09-level-adaptive-guided-daily-session-ui-with-heatmap-dhor-cycle-tracker-and-session-flow
plan: 03
subsystem: ui
tags: [react-native, svg, heatmap, zustand, modal, hifz]

requires:
  - phase: 09-01
    provides: "madinahHifzStore with session tracking, quality scores, level transition detection"
provides:
  - "HeatmapGrid: 30x20 SVG mushaf heatmap colored by juz quality"
  - "DhorCycleTracker: linear progress bar with per-juz quality segments"
  - "LevelTransition: modal comparing old vs new LevelConfig on level change"
  - "MissedDayBanner: amber recovery prompt for missed days"
  - "Hub integration: all four components wired into HifzTab"
affects: [session-flow, hifz-tab]

tech-stack:
  added: []
  patterns: [individual-zustand-selectors, svg-grid-rendering, modal-interstitial]

key-files:
  created:
    - lawh-mobile/components/hifz/HeatmapGrid.tsx
    - lawh-mobile/components/hifz/DhorCycleTracker.tsx
    - lawh-mobile/components/hifz/LevelTransition.tsx
    - lawh-mobile/components/hifz/MissedDayBanner.tsx
  modified:
    - lawh-mobile/app/(main)/hub.tsx

key-decisions:
  - "Used react-native-svg Rect for 600-cell heatmap with useMemo optimization"
  - "Linear progress bar for dhor cycle (simpler than circular, consistent with card layout)"
  - "LevelTransition uses useResolvedTheme for full theme support including parchment"
  - "MissedDayBanner uses local useState dismiss (resets each app session)"

patterns-established:
  - "getQualityColor helper: shared color mapping for quality 1-5 across components"
  - "Modal interstitial pattern: transparent overlay + centered card with dismiss"

requirements-completed: [P9-03, P9-04, P9-05, P9-07, P9-08]

duration: 3min
completed: 2026-03-09
---

# Phase 09 Plan 03: Heatmap, Dhor Tracker, Level Transition & Missed Day Banner Summary

**Mushaf heatmap SVG grid, dhor cycle progress bar, level transition modal, and missed day banner wired into Hifz tab**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T04:57:13Z
- **Completed:** 2026-03-09T05:00:14Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- 30x20 SVG heatmap grid with quality-based coloring and color legend
- Linear dhor cycle tracker showing day progress and per-juz quality dots
- Level transition modal with config diff table (sabaq/dhor/sabqi/cycle changes)
- Missed day amber banner with dismiss functionality
- All four components integrated into hub.tsx HifzTab with individual zustand selectors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create HeatmapGrid and DhorCycleTracker** - `c939943` (feat)
2. **Task 2: Create LevelTransition, MissedDayBanner, and wire into hub** - `023cb01` (feat)

## Files Created/Modified
- `lawh-mobile/components/hifz/HeatmapGrid.tsx` - 30x20 SVG mushaf heatmap with quality coloring and legend
- `lawh-mobile/components/hifz/DhorCycleTracker.tsx` - Linear dhor cycle progress with per-juz quality segments
- `lawh-mobile/components/hifz/LevelTransition.tsx` - Modal comparing old vs new LevelConfig on level change
- `lawh-mobile/components/hifz/MissedDayBanner.tsx` - Amber recovery banner for missed days
- `lawh-mobile/app/(main)/hub.tsx` - Integrated all four components into HifzTab

## Decisions Made
- Used react-native-svg Rect for 600-cell heatmap with useMemo keyed on memorizedSet + qualityScores for performance
- Linear progress bar for dhor cycle rather than circular (simpler, consistent with existing card layout)
- LevelTransition uses useResolvedTheme directly (not isDark prop) for full theme support including parchment variant
- MissedDayBanner dismiss is local useState (resets each app session so banner reappears if still missed)
- Wrapped HifzTab ScrollView in a View to render LevelTransition modal outside scroll area

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TS errors in JuzIndex.tsx (SharedValue type from react-native-reanimated) -- out of scope, not related to this plan

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Visual feedback layer complete: heatmap, cycle tracker, level transitions, missed day recovery
- Ready for session flow UI (plan 09-04) which will use these visual indicators

---
*Phase: 09-level-adaptive-guided-daily-session-ui-with-heatmap-dhor-cycle-tracker-and-session-flow*
*Completed: 2026-03-09*

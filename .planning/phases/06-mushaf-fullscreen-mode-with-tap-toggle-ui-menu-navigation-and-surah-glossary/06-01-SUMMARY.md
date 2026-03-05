---
phase: 06-mushaf-fullscreen-mode-with-tap-toggle-ui-menu-navigation-and-surah-glossary
plan: 01
subsystem: ui
tags: [expo-router, stack-navigation, react-hooks, fullscreen, chrome-toggle]

# Dependency graph
requires:
  - phase: 01.1-madinah-mushaf-page-view
    provides: MushafScreen, PageNavigator, mushaf rendering components
provides:
  - (main) Stack layout replacing tab navigation
  - useChromeToggle hook for chrome visibility with auto-hide
  - Controlled PageNavigator (no internal timer)
  - Placeholder screens for hub, contents, hifz, recite, review, profile, settings
affects: [06-02-chrome-overlay, 06-03-contents-hub]

# Tech tracking
tech-stack:
  added: []
  patterns: [controlled-component-visibility, chrome-toggle-hook, stack-navigation-layout]

key-files:
  created:
    - lawh-mobile/hooks/useChromeToggle.ts
    - lawh-mobile/app/(main)/_layout.tsx
    - lawh-mobile/app/(main)/index.tsx
    - lawh-mobile/app/(main)/hub.tsx
    - lawh-mobile/app/(main)/contents.tsx
    - lawh-mobile/app/(main)/hifz.tsx
    - lawh-mobile/app/(main)/recite.tsx
    - lawh-mobile/app/(main)/review.tsx
    - lawh-mobile/app/(main)/profile.tsx
    - lawh-mobile/app/(main)/settings.tsx
  modified:
    - lawh-mobile/app/_layout.tsx
    - lawh-mobile/components/mushaf/PageNavigator.tsx
    - lawh-mobile/components/mushaf/MushafScreen.tsx

key-decisions:
  - "Used useFocusEffect from expo-router for timer reset on screen focus"
  - "Typed route path /(main) without trailing slash for Expo Router typed routes compatibility"
  - "Removed handleOpenSurahList from MushafScreen since PageNavigator no longer triggers it"

patterns-established:
  - "Chrome toggle pattern: useChromeToggle hook manages visibility state, parent conditionally renders chrome components"
  - "Controlled visibility: PageNavigator has no internal show/hide logic, parent decides when to render"

requirements-completed: [FSCR-01, FSCR-02, FSCR-06]

# Metrics
duration: 8min
completed: 2026-03-05
---

# Phase 06 Plan 01: Route Restructuring and Chrome Toggle Summary

**Stack layout replacing tab bar with useChromeToggle auto-hide hook and controlled PageNavigator**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-05T18:47:57Z
- **Completed:** 2026-03-05T18:56:00Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- Replaced 5-tab layout with Stack navigator under (main) route group -- tab bar is gone from mushaf
- Created useChromeToggle hook with 5s auto-hide timer, toggle/show/hide/resetTimer, and useFocusEffect cleanup
- Refactored PageNavigator to pure controlled component (no internal visibility, timer, or opacity animation)
- All 8 screen routes resolve (index, hub, contents, hifz, recite, review, profile, settings)

## Task Commits

Each task was committed atomically:

1. **Task 1: Route restructuring and useChromeToggle hook** - `2f20ff2` (feat)
2. **Task 2: Refactor PageNavigator to controlled mode** - `8f86682` (refactor)

## Files Created/Modified
- `lawh-mobile/hooks/useChromeToggle.ts` - Chrome visibility hook with auto-hide timer
- `lawh-mobile/app/(main)/_layout.tsx` - Stack navigator layout (replaces tabs)
- `lawh-mobile/app/(main)/index.tsx` - Mushaf home screen (renders MushafScreen)
- `lawh-mobile/app/(main)/hub.tsx` - Hub placeholder screen
- `lawh-mobile/app/(main)/contents.tsx` - Contents placeholder screen
- `lawh-mobile/app/(main)/hifz.tsx` - Hifz placeholder screen
- `lawh-mobile/app/(main)/recite.tsx` - Recite placeholder screen
- `lawh-mobile/app/(main)/review.tsx` - Review placeholder screen
- `lawh-mobile/app/(main)/profile.tsx` - Profile placeholder screen
- `lawh-mobile/app/(main)/settings.tsx` - Settings placeholder screen
- `lawh-mobile/app/_layout.tsx` - Updated AuthGate redirect and Stack.Screen name
- `lawh-mobile/components/mushaf/PageNavigator.tsx` - Stripped to controlled component
- `lawh-mobile/components/mushaf/MushafScreen.tsx` - Removed onOpenSurahList prop from PageNavigator

## Decisions Made
- Used `useFocusEffect` from expo-router to reset auto-hide timer when screen regains focus (addresses expo-router pitfall where timers persist across navigation)
- Used `/(main)` route path without trailing slash for Expo Router typed routes compatibility
- Removed `handleOpenSurahList` callback from MushafScreen since PageNavigator no longer references it (surah list access moves to chrome overlay in Plan 02)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed typed route path format**
- **Found during:** Task 1 (Route restructuring)
- **Issue:** `/(main)/` with trailing slash failed TypeScript typed routes validation
- **Fix:** Changed to `/(main)` without trailing slash
- **Files modified:** lawh-mobile/app/_layout.tsx
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 2f20ff2

**2. [Rule 2 - Missing Critical] Removed unused handleOpenSurahList from MushafScreen**
- **Found during:** Task 2 (PageNavigator refactor)
- **Issue:** MushafScreen still had `handleOpenSurahList` callback and passed `onOpenSurahList` prop that no longer existed on PageNavigator
- **Fix:** Removed the prop from PageNavigator call and the unused callback
- **Files modified:** lawh-mobile/components/mushaf/MushafScreen.tsx
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 8f86682

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both auto-fixes necessary for type safety. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Route structure is ready for Plan 02 to add chrome overlay integration to MushafScreen
- useChromeToggle hook is ready to be consumed by MushafScreen for tap-to-toggle visibility
- PageNavigator accepts controlled visibility pattern -- Plan 02 will conditionally render it based on useChromeToggle.visible

---
*Phase: 06-mushaf-fullscreen-mode-with-tap-toggle-ui-menu-navigation-and-surah-glossary*
*Completed: 2026-03-05*

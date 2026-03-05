---
phase: 07-expanded-footer-with-reading-layout-selector-microphone-placeholder-and-ayah-long-press-action-sheet-with-haptic-feedback
plan: 03
subsystem: ui
tags: [reading-mode, card-view, tajweed, popover, layout-selector, mushaf]

# Dependency graph
requires:
  - phase: 07-expanded-footer-with-reading-layout-selector-microphone-placeholder-and-ayah-long-press-action-sheet-with-haptic-feedback
    plan: 01
    provides: MushafFooter, settingsStore readingMode/tajweedEnabled, translationData service
provides:
  - LayoutSelectorPopover with 3 reading modes and tajweed toggle
  - CardView with lazy-loading FlatList of ayah cards by surah
  - AyahCard component for Arabic-only and translation card modes
  - Reading mode switching in MushafScreen (mushaf/arabic-cards/translation-cards)
  - Tajweed color override for V4 font COLRv1 palette workaround
  - Chrome timer pause/resume for popover interaction
affects: [07-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [COLRv1 color override workaround for tajweed toggle, lazy surah loading with onEndReached pagination]

key-files:
  created:
    - lawh-mobile/components/mushaf/LayoutSelectorPopover.tsx
    - lawh-mobile/components/mushaf/CardView.tsx
    - lawh-mobile/components/mushaf/AyahCard.tsx
  modified:
    - lawh-mobile/hooks/useChromeToggle.ts
    - lawh-mobile/components/mushaf/MushafFooter.tsx
    - lawh-mobile/components/mushaf/MushafScreen.tsx
    - lawh-mobile/components/mushaf/MushafPage.tsx

key-decisions:
  - "Used COLRv1 color override workaround instead of native CPAL palette selection (not supported in React Native)"
  - "Lazy-load surahs 3 at a time in CardView with onEndReached pagination for performance"
  - "Used Modal with transparent backdrop for popover positioning above footer"

patterns-established:
  - "COLRv1 tajweed toggle: tajweedEnabled ? undefined : uniformColor for text color override"
  - "Lazy surah pagination: load INITIAL_SURAHS on mount, LOAD_MORE_SURAHS on scroll end"

requirements-completed: [FOOT-02, FOOT-06]

# Metrics
duration: 4min
completed: 2026-03-05
---

# Phase 7 Plan 03: Layout Selector & Card Views Summary

**LayoutSelectorPopover with three reading modes (mushaf/arabic-cards/translation-cards), tajweed toggle with COLRv1 color override, and lazy-loading CardView with AyahCard components**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-05T21:01:58Z
- **Completed:** 2026-03-05T21:05:59Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- LayoutSelectorPopover with 3 mode buttons (Mushaf, Arabic, Translation) and tajweed Switch toggle
- CardView with lazy surah loading (3 initial + 3 per scroll), FlatList with viewability tracking
- AyahCard with Arabic text (RTL, KFGQPCHafs font) and optional English translation
- Reading mode switching in MushafScreen conditionally renders CardView or mushaf PagerView/FlatList
- Tajweed toggle wired through MushafScreen -> MushafPage -> V4 text elements using color override
- Chrome timer pause/resume prevents auto-hide while popover is open

## Task Commits

Each task was committed atomically:

1. **Task 1: Create LayoutSelectorPopover and add pause to useChromeToggle** - `d40361d` (feat)
2. **Task 2: Create CardView and AyahCard, wire reading mode switching and tajweed palette** - `44b3d5d` (feat)

## Files Created/Modified
- `lawh-mobile/components/mushaf/LayoutSelectorPopover.tsx` - Modal popover with 3 reading mode buttons + tajweed toggle switch
- `lawh-mobile/components/mushaf/AyahCard.tsx` - Individual ayah card with Arabic text and optional translation
- `lawh-mobile/components/mushaf/CardView.tsx` - FlatList container with lazy surah loading and position tracking
- `lawh-mobile/hooks/useChromeToggle.ts` - Added pause/resume methods for timer control during popover
- `lawh-mobile/components/mushaf/MushafFooter.tsx` - Wired popover open/close with chrome timer pause/resume
- `lawh-mobile/components/mushaf/MushafScreen.tsx` - Added reading mode switching, CardView rendering, tajweed palette
- `lawh-mobile/components/mushaf/MushafPage.tsx` - Added tajweedColorOverride prop for V4 font color override

## Decisions Made
- Used COLRv1 color override workaround (uniform text color when tajweed off) instead of native CPAL palette selection, since React Native does not support COLRv1 palette selection natively
- Lazy-load surahs 3 at a time using onEndReached pagination to avoid loading all 6236 ayahs at once
- Used batch `getAyahsBySurah` instead of per-ayah queries for CardView data loading
- Used Modal with transparent backdrop for popover positioning instead of a bottom sheet library

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Layout selector and card views complete, ready for Plan 04
- Reading mode persists via settingsStore (AsyncStorage)
- CardView tracks scroll position and updates lastReadPage for position preservation
- Tajweed toggle affects mushaf V4 rendering via color override pattern

---
*Phase: 07-expanded-footer-with-reading-layout-selector-microphone-placeholder-and-ayah-long-press-action-sheet-with-haptic-feedback*
*Completed: 2026-03-05*

---
phase: quick-5
plan: 01
subsystem: mushaf-card-view
tags: [ui, card-view, ayah-actions, separator, menu]
dependency_graph:
  requires: []
  provides: [ayah-card-separator, ayah-card-label, ayah-card-menu, card-view-action-sheet]
  affects: [AyahCard, CardView]
tech_stack:
  added: []
  patterns: [React.memo, useCallback, useState for sheet state]
key_files:
  created: []
  modified:
    - lawh-mobile/components/mushaf/AyahCard.tsx
    - lawh-mobile/components/mushaf/CardView.tsx
decisions:
  - Added marginBottom: 16 to translationCard style (not container) to preserve spacing after translation block without card-level gap
  - Used hairlineWidth separator at top of each card so visual rhythm is created by card content, not margins
metrics:
  duration: ~5 minutes
  completed: 2026-03-06T04:59:00Z
  tasks_completed: 2
  files_modified: 2
---

# Quick Task 5: Ayah Separator Lines, Chapter/Ayah Labels, and Three-Dot Menu Summary

**One-liner:** Added hairline separator, [surahId:ayahNumber] label, and three-dot menu button to each AyahCard; tapping three-dot opens AyahActionSheet for that ayah via CardView state management.

## What Was Changed

### lawh-mobile/components/mushaf/AyahCard.tsx

- Added `onMenuPress?: () => void` optional prop to `AyahCardProps`
- Added `Pressable` to react-native imports
- Added hairline `separator` View at the very top of each card (uses `StyleSheet.hairlineWidth`)
- Added `cardHeader` row with `[surahId:ayahNumber]` label at left and three-dot (U+22EE) `Pressable` button at right
- Added color variables: `labelColor` (muted secondary) and `separatorColor` (matches existing `lineColor` in CardView)
- Changed `container` `marginBottom` from `16` to `0` (separator provides visual division)
- Moved `marginBottom: 16` into `translationCard` style so cards without translation still collapse cleanly
- New styles: `separator`, `cardHeader`, `ayahLabel`, `menuButton`, `menuDots`

### lawh-mobile/components/mushaf/CardView.tsx

- Imported `AyahActionSheet` from `./AyahActionSheet`
- Added `onMenuPress?: (surahId: number, ayahNumber: number) => void` to `CardListItemProps`
- `CardListItem` passes `onMenuPress` down to `AyahCard` as `() => onMenuPress(item.surahId, item.ayahNumber)`
- Added `actionSheetAyah` state (`{ surahId, ayahNumber } | null`) to `CardViewInner`
- Added `handleMenuPress` (`useCallback`) to set `actionSheetAyah`
- Added `handleActionSheetClose` (`useCallback`) to clear `actionSheetAyah`
- Added `handleMenuPress` to `renderItem` `useCallback` dependency array
- Passed `onMenuPress={handleMenuPress}` to `CardListItem` in `renderItem`
- Rendered `<AyahActionSheet>` at bottom of root `View`, wired to `actionSheetAyah` state

## Verification Results

- `npx tsc --noEmit` in lawh-mobile: zero errors introduced (only pre-existing `JuzIndex.tsx` reanimated SharedValue errors unrelated to this task)
- Both tasks compiled cleanly
- Existing `onPress` (tap to toggle chrome) on `CardListItem` is unaffected

## Deviations from Plan

**1. [Rule 1 - Bug] Added marginBottom to translationCard instead of removing from container entirely**

- **Found during:** Task 1
- **Issue:** The plan said change `container` `marginBottom: 16` to `0`. However, cards with a translation block need bottom spacing after the translation card. Removing marginBottom from the container with no replacement would collapse spacing after translation cards.
- **Fix:** Set `container` `marginBottom: 0` as specified, but also added `marginBottom: 16` to `translationCard` style so only cards with translation have bottom spacing. Cards showing only Arabic text use the separator-based visual rhythm naturally.
- **Files modified:** lawh-mobile/components/mushaf/AyahCard.tsx
- **Commit:** 4566a65

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 4566a65 | feat(quick-5): add separator line, ayah label, and three-dot menu button to AyahCard |
| 2 | 86ec7e9 | feat(quick-5): wire three-dot menu to AyahActionSheet in CardView |

## Self-Check: PASSED

- `lawh-mobile/components/mushaf/AyahCard.tsx` exists and modified
- `lawh-mobile/components/mushaf/CardView.tsx` exists and modified
- Commit 4566a65 exists in git log
- Commit 86ec7e9 exists in git log

---
phase: quick-8
plan: 1
subsystem: mobile-ui
tags: [settings, quran, ui-redesign, zustand]
dependency_graph:
  requires: [settingsStore, BlueSurahBanner]
  provides: [quran-settings-redesign, pageDesign-setting, landscapeLayout-setting, thematicHighlighting-setting]
  affects: [settings-page, mushaf-rendering]
tech_stack:
  added: []
  patterns: [zustand-individual-selectors, card-based-settings-ui, cropped-svg-preview]
key_files:
  created: []
  modified:
    - lawh-mobile/stores/settingsStore.ts
    - lawh-mobile/app/(main)/quran-settings.tsx
decisions:
  - Used individual zustand selectors per setting to minimize re-renders
  - Cropped left-half SVG preview (80x48 container with 160px-wide SVG, overflow hidden) for theme previews
  - Classic theme preview uses QuranCommon font header ligature on dark green background
  - Section title style uses muted gold/brown uppercase with letter-spacing for visual hierarchy
metrics:
  duration: ~3min
  completed: "2026-03-06"
---

# Quick Task 8: Redesign Quran Settings Page Summary

Full 5-section Quran settings page with warm cream background, white card sections, green checkmarks, cropped SVG theme previews, and Switch toggle for thematic highlighting.

## What Was Done

### Task 1: Add new settings to settingsStore (4b7ac80)

Added three new persisted settings to the zustand store:
- `pageDesign: 'fullscreen' | 'book'` (default: `'fullscreen'`) with exported `PageDesign` type
- `landscapeLayout: 'single' | 'double'` (default: `'double'`) with exported `LandscapeLayout` type
- `thematicHighlighting: boolean` (default: `false`)

Each setting has a setter method and is included in `partialize` for AsyncStorage persistence.

### Task 2: Rewrite quran-settings.tsx with 5-section design (f7c057f)

Complete rewrite of the Quran settings page with:

1. **Scroll Direction** - Horizontal/Vertical radio rows mapped to `navigationMode`
2. **Page Design** - Fullscreen/Book radio rows mapped to `pageDesign`
3. **Landscape Layout** - Single/Double radio rows mapped to `landscapeLayout`
4. **Theme** - 4 theme options (BW, Classic, Blue, Pink) with cropped left-half SVG ornament previews; classic uses QuranCommon font header ligature on dark background
5. **Thematic Highlighting** - Toggle switch with description text

Design: warm cream `#F5F0E8` background, white card sections with `borderRadius: 12`, muted gold `#9C8D6E` section titles, Ionicons row icons in `#6B5D45`, green `#4CAF50` checkmarks for selected options, hairline separators between rows.

Reusable `SettingRow` component handles all radio-style rows with optional preview node support.

## Deviations from Plan

None - plan executed exactly as written. All settings were already present in the store (added in a prior attempt).

## Verification

- TypeScript: Pre-existing errors only (unrelated @expo/vector-icons, react-native-reanimated type issues). No new errors from these changes.
- Both commits verified in git history.

## Self-Check: PASSED

- settingsStore.ts: FOUND
- quran-settings.tsx: FOUND
- Commit 4b7ac80: FOUND
- Commit f7c057f: FOUND

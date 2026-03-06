---
phase: quick-10
plan: 1
subsystem: mobile-theme
tags: [dark-mode, theming, ui]
dependency_graph:
  requires: [useResolvedTheme hook, settingsStore DarkVariant type]
  provides: [app-wide dark mode support, themed sub-components]
  affects: [all main screens, contents sub-components]
tech_stack:
  patterns: [optional color props with backward-compatible defaults, centralized theme hook]
key_files:
  modified:
    - lawh-mobile/app/(main)/theme-settings.tsx
    - lawh-mobile/app/(main)/settings.tsx
    - lawh-mobile/app/(main)/quran-settings.tsx
    - lawh-mobile/app/(main)/contents.tsx
    - lawh-mobile/components/contents/SurahRow.tsx
    - lawh-mobile/components/contents/JuzSectionHeader.tsx
    - lawh-mobile/components/contents/JuzIndex.tsx
    - lawh-mobile/components/contents/ContentsTabBar.tsx
decisions:
  - Used optional color prop objects with defaults for sub-components (backward compatible)
  - Changed Navy dark variant to Dark Gray (#1C1C1E) with ellipse-outline icon
  - Toggle pills invert colors in dark mode (white bg + black text when active)
metrics:
  duration: 4m 22s
  completed: 2026-03-06
---

# Quick Task 10: Fix App-Wide Theme, Basmallah Dark Mode, and Theme Wiring Summary

App-wide dark mode via useResolvedTheme hook wired to all 6 screens and 4 contents sub-components, Navy variant renamed to Dark Gray.

## What Was Done

### Task 1: Fix Navy to Dark Gray and Wire Theme to theme-settings (ae24cd3)

- Changed `DarkVariant` option from `'navy'`/`'Navy'`/`boat-outline` to `'gray'`/`'Dark Gray'`/`ellipse-outline` in theme-settings.tsx
- Imported `useResolvedTheme` and applied dynamic theme colors to theme-settings container, header, cards, text, icons, and separators
- Note: `useResolvedTheme` hook and `MushafBismillah` dark mode fix were already completed in quick task 9

### Task 2: Wire useResolvedTheme to All App Screens (b1264f7)

- **settings.tsx**: Replaced all hardcoded colors (#fff, #000, #888, #f8f8f8, #e0e0e0, #333, #999) with theme tokens from useResolvedTheme
- **quran-settings.tsx**: Applied theme colors to container, header, cards, icons, text, switch track, and separators
- **contents.tsx**: Wired theme to toggle pills, sort dropdown, dropdown modal, coming soon section. Created memoized color objects passed to sub-components
- **SurahRow.tsx**: Added optional `colors` prop (bg, currentBg, text, muted, calligraphy, border) with backward-compatible defaults
- **JuzSectionHeader.tsx**: Added optional `colors` prop (bg, text, line) with defaults
- **JuzIndex.tsx**: Added optional `colors` prop (bg, text, border) with defaults
- **ContentsTabBar.tsx**: Added optional `colors` prop (bg, border, text, activeText, muted) with defaults

## Deviations from Plan

None - plan executed as written. The useResolvedTheme hook expansion and MushafBismillah fix were already completed in quick task 9, so Task 1 focused on the Navy-to-Gray rename and theme-settings wiring.

## Decisions Made

1. Used optional color prop objects with backward-compatible defaults for all sub-components, so they work both standalone and when theme colors are passed from parent
2. Toggle pills in contents.tsx invert in dark mode: active pill gets white bg + black text (dark), vs black bg + white text (light)
3. Dropdown modal background matches the screen background color for seamless appearance

## Verification

- TypeScript compiles with zero new errors (only pre-existing @expo/vector-icons and react-native-reanimated type resolution issues remain)
- All 6 screens (hub, settings, quran-settings, theme-settings, contents, profile) use useResolvedTheme
- All 4 contents sub-components accept and apply theme color props
- Hub and Profile were already wired from quick task 6, confirmed still working

## Self-Check: PASSED

All 8 modified files exist on disk. Both commits (ae24cd3, b1264f7) verified in git log.

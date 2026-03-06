---
phase: quick
plan: 9
subsystem: mobile-ui
tags: [theme, dark-mode, settings, mushaf]
dependency_graph:
  requires: []
  provides: [useResolvedTheme, AppThemeMode, LightVariant, DarkVariant, theme-settings-page]
  affects: [MushafFrame, MushafPage, MushafScreen, MushafPageHeader, MushafBismillah, settings, quran-settings]
tech_stack:
  added: []
  patterns: [zustand-theme-state, resolved-theme-hook, theme-prop-drilling]
key_files:
  created:
    - lawh-mobile/hooks/useResolvedTheme.ts
    - lawh-mobile/app/(main)/theme-settings.tsx
  modified:
    - lawh-mobile/stores/settingsStore.ts
    - lawh-mobile/components/mushaf/MushafFrame.tsx
    - lawh-mobile/components/mushaf/MushafPage.tsx
    - lawh-mobile/components/mushaf/MushafScreen.tsx
    - lawh-mobile/components/mushaf/MushafPageHeader.tsx
    - lawh-mobile/components/mushaf/MushafBismillah.tsx
    - lawh-mobile/app/(main)/quran-settings.tsx
    - lawh-mobile/app/(main)/settings.tsx
    - lawh-mobile/app/(main)/_layout.tsx
decisions:
  - Used inline theme resolution in MushafPage (zustand selectors + useColorScheme) to avoid breaking React.memo
  - Created separate theme-settings page instead of adding to quran-settings per user override
  - Used LightVariant 'parchment' naming (user-facing) instead of 'beige' (internal)
metrics:
  duration: 221s
  completed: "2026-03-06T06:17:09Z"
---

# Quick Task 9: App Theme Settings Summary

Add Auto/Light/Dark theme with light sub-variants (White/Parchment) and dark sub-variants (True Black/Navy), wired through all mushaf rendering components.

## One-liner

Theme settings with Auto/Light/Dark mode selection, Parchment/Navy sub-variants, and full mushaf component color wiring via useResolvedTheme hook.

## What Was Built

### Store Layer
- Added `AppThemeMode` (`auto`/`light`/`dark`), `LightVariant` (`white`/`parchment`), `DarkVariant` (`black`/`navy`) types to settingsStore
- Added three new persisted state fields with setters
- Default: auto mode, white light variant, black dark variant

### useResolvedTheme Hook
- Centralized theme resolution combining store state + system color scheme
- Returns `isDark`, `backgroundColor`, `textColor`, `secondaryTextColor`, `separatorColor`
- Used by MushafScreen for root container styling

### Theme-Settings Page
- New `theme-settings.tsx` with Auto/Light/Dark mode cards
- Conditional Light Style (White/Parchment) and Dark Style (True Black/Navy) sub-cards
- Sub-cards shown based on mode: Auto shows both, Light shows only light, Dark shows only dark

### Settings Page Redesign
- Replaced single Quran row with Appearance section containing two rows
- Row 1: Quran (shows current reading mode, navigates to quran-settings)
- Row 2: Theme (shows current theme mode, navigates to theme-settings)

### Mushaf Component Wiring
- **MushafFrame**: accepts `backgroundColor` prop, overrides hardcoded `#fff`
- **MushafPageHeader**: accepts `textColor` and `separatorColor` props
- **MushafBismillah**: accepts `textColor` prop for non-color-font layers
- **MushafPage**: resolves theme inline using zustand selectors + useColorScheme, passes colors to all children
- **MushafScreen**: uses `useResolvedTheme` for root bg, loading state, and StatusBar style

### Quran Settings Fixes
- Changed background from cream (#F5F0E8) to white (#FFFFFF)
- Renamed "THEME" section title to "BANNER STYLE"

## Color Mapping

| Mode | Variant | Background | Text | Secondary | Separator |
|------|---------|-----------|------|-----------|-----------|
| Light | White | #FFFFFF | #000000 | #666666 | #e0e0e0 |
| Light | Parchment | #FAF6F0 | #000000 | #666666 | #e0e0e0 |
| Dark | True Black | #000000 | #FFFFFF | #999999 | #333333 |
| Dark | Navy | #0A1628 | #FFFFFF | #999999 | #333333 |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | ff946ec | Add theme types/state to store and useResolvedTheme hook |
| 2 | 699ae64 | Wire theme into mushaf components, add theme-settings page |

## Deviations from Plan

### User Overrides Applied

1. **Theme settings as separate page**: Plan had Appearance section in quran-settings; user corrected to separate theme-settings.tsx page
2. **Quran-settings background**: Changed from cream (#F5F0E8) to white (#FFFFFF) per user correction
3. **Settings page redesign**: Replaced single Quran row with two-row Appearance section (Quran + Theme) per user correction
4. **LightVariant naming**: Used 'parchment' instead of 'beige' to match user's "Parchment" label preference

### Auto-fixed Issues

None -- plan executed as corrected by user overrides.

## Self-Check: PASSED

All 11 files verified on disk. Both commit hashes (ff946ec, 699ae64) confirmed in git log.

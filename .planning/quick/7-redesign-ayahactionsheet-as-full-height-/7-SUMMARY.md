---
quick_task: 7
title: Redesign AyahActionSheet as full-height swipe-up sheet
date: "2026-03-06"
commit: 5f54ced
files_modified:
  - lawh-mobile/components/mushaf/AyahActionSheet.tsx
tags: [ui, action-sheet, mushaf, ionicons, translation, audio]
---

# Quick Task 7: Redesign AyahActionSheet as Full-Height Swipe-Up Sheet

Full rewrite of `AyahActionSheet.tsx` into a near-full-screen swipe-up modal matching the Tarteel-inspired layout, with structured sections, Ionicons, safe-area insets, and auto-loaded translation.

## What Changed

### Layout

- **Before:** `maxHeight: '70%'` bottom sheet with flat action grid
- **After:** Full-height sheet using `marginTop: insets.top + 10` — goes nearly to top of screen

### Structure (top to bottom)

1. **Handle bar** — drag indicator at top
2. **Header row** — centered surah name + ayah number (e.g. "Maryam: 19"), X close button top-right using `Ionicons name="close"`
3. **Bookmark row** — two side-by-side half-buttons: "Bookmark" (bookmark-outline icon) and "All Bookmarks" (chevron-forward)
4. **Recitation section** — section title "RECITATION", two half-buttons: "Play" (play icon) and "Play To" (play + chevron). Tapping Play toggles inline `AyahAudioPlayer`
5. **Translation section** — section title "TRANSLATION", card auto-loaded with `translationService.getTranslation()` on `visible` change. Shows "Saheeh International" source label. "Tafsir" full-width button with chevron expands Ibn Kathir tafsir inline
6. **Sharing section** — section title "SHARING", three equal-width buttons: Copy (copy-outline), Download (download-outline), Share (share-social-outline)
7. **ScrollView wraps all sections** — fully scrollable

### Technical

- Removed `maxHeight: '70%'` entirely
- Added `useSafeAreaInsets` for `marginTop` and `paddingBottom`
- All icons use `Ionicons` from `@expo/vector-icons` (no unicode/emoji)
- Auto-loads translation via `useEffect([visible, ayahInfo])` — no button tap required
- Copy uses `Clipboard.setString()` from `react-native` (expo-clipboard not installed in project)
- Share uses `Share.share()` from `react-native` with formatted message including surah reference
- Surah name lookup via `chapters[surahId].nameSimple` from `@/lib/data/mushafData`
- `React.memo` wrapper preserved
- Same props interface: `{ visible, ayahInfo, onClose }`
- Dark mode support with all color variables

## Deviations

### Auto-fix: Used react-native Clipboard instead of expo-clipboard

- **Found during:** Implementation
- **Issue:** `expo-clipboard` is not installed in the project (`expo-clipboard` absent from `package.json` and `node_modules`)
- **Fix:** Used `Clipboard` from `react-native` (`Clipboard.setString(text)`)
- **Impact:** None — same behavior, `react-native` Clipboard works in Expo managed workflow

### Note: @expo/vector-icons TypeScript resolution

- The `@expo/vector-icons` module resolves at runtime through expo's nested `node_modules/expo/node_modules/@expo/vector-icons` path
- TypeScript strict check shows `TS2307` for this import, but this is a pre-existing project issue also present in `hub.tsx`
- Metro bundler resolves the path correctly at build/run time

## Self-Check

- [x] File exists: `lawh-mobile/components/mushaf/AyahActionSheet.tsx`
- [x] Commit exists: `5f54ced`
- [x] Props interface unchanged: `{ visible, ayahInfo, onClose }`
- [x] `React.memo` wrapper preserved
- [x] No unicode/emoji icons — all `Ionicons`
- [x] Translation auto-loads on sheet open
- [x] Full-height layout: `marginTop: insets.top + 10`

---
phase: quick
plan: 3
subsystem: mushaf-ui
tags: [card-view, page-breaks, surah-headers, mushaf-header]
dependency_graph:
  requires: []
  provides: [page-break-indicators, inline-surah-headers, unified-mushaf-header]
  affects: [CardView, MushafPageHeader, MushafPage]
tech_stack:
  added: []
  patterns: [discriminated-union-flatlist, useMemo-list-transform]
key_files:
  created: []
  modified:
    - lawh-mobile/components/mushaf/CardView.tsx
    - lawh-mobile/components/mushaf/MushafPageHeader.tsx
    - lawh-mobile/components/mushaf/MushafPage.tsx
decisions:
  - Used discriminated union types for mixed FlatList items (ayah, page-break, surah-header)
  - Page break shows NEW page number (the page being entered)
  - Surah headers reuse existing MushafSurahBanner and MushafBismillah components
metrics:
  duration: 101s
  completed: "2026-03-05T22:07:19Z"
---

# Quick Task 3: Page Break Indicators, Inline Surah Headers, and Unified Mushaf Header

Discriminated union FlatList with page-break separators and surah banners at boundaries, plus simplified MushafPageHeader matching CardView's 3-column layout.

## Changes Made

### Task 1: Page break indicators and inline surah headers in CardView

**Commit:** `0db5cd1`

Added discriminated union types (`AyahItem | PageBreakItem | SurahHeaderItem`) to CardView's FlatList. A `useMemo` transform builds the mixed list by inserting `SurahHeaderItem` before each surah's first ayah and `PageBreakItem` at page boundaries. The render function handles all three types: ayah cards (unchanged), page breaks (hairline divider with centered page number), and surah headers (MushafSurahBanner + MushafBismillah when `bismillahPre` is true). The `onViewableItemsChanged` callback skips non-ayah items.

**Files modified:**
- `lawh-mobile/components/mushaf/CardView.tsx`

### Task 2: Replace MushafPageHeader with simple 3-column layout

**Commit:** `2923f9e`

Removed the `HizbQuarterIcon` component and `hizb`/`quarter` props from MushafPageHeader. Replaced the Madani-style header with a simple 3-column row: surahName | page | Part N, matching CardView's sticky header style. Updated MushafPage.tsx to pass only the required props.

**Files modified:**
- `lawh-mobile/components/mushaf/MushafPageHeader.tsx`
- `lawh-mobile/components/mushaf/MushafPage.tsx`

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- [x] `lawh-mobile/components/mushaf/CardView.tsx` - modified
- [x] `lawh-mobile/components/mushaf/MushafPageHeader.tsx` - modified
- [x] `lawh-mobile/components/mushaf/MushafPage.tsx` - modified
- [x] Commit `0db5cd1` exists
- [x] Commit `2923f9e` exists
- [x] TypeScript compiles (only pre-existing errors in JuzIndex.tsx)

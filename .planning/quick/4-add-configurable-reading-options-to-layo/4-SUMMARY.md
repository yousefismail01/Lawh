---
phase: quick
plan: 4
subsystem: mobile-ui
tags: [reading-options, settings, card-view, font-size, layout-selector]
key-files:
  modified:
    - lawh-mobile/stores/settingsStore.ts
    - lawh-mobile/components/mushaf/LayoutSelectorPopover.tsx
    - lawh-mobile/components/mushaf/AyahCard.tsx
    - lawh-mobile/components/mushaf/CardView.tsx
decisions:
  - Used step-dot track slider (Pressable with locationX) instead of external slider library
  - Used React Native built-in Switch with iOS green (#34c759) for toggles
  - Translation toggle only affects translation-cards mode (not arabic-cards)
  - Extracted CardListItem memoized component for FlatList perf optimization
metrics:
  duration: ~3 minutes
  completed: 2026-03-05
  tasks_completed: 3
  tasks_total: 3
---

# Quick Task 4: Add Configurable Reading Options to Layout Selector Summary

Reading options panel with Arabic verse toggle + font size, transliteration toggle, translation toggle + source row + font size, wired to card views via settings store.

## Tasks Completed

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Add reading option settings to settingsStore | 8621a31 | Added showArabicVerse, showTransliteration, showTranslation, arabicFontSize, translationFontSize with defaults, setters, and persistence |
| 2 | Add reading options UI to LayoutSelectorPopover | 38730ed | ToggleRow + FontSizeSlider components, contextual sections for Arabic/Transliteration/Translation, ScrollView wrapper, step-dot slider |
| 3 | Wire settings to AyahCard and CardView | 078a750 | AyahCard accepts font size and visibility props, CardView reads store, CardListItem memoized for perf |

## Implementation Details

### Settings Store (Task 1)
Already had the fields added from prior work. Committed the uncommitted changes: 5 new boolean/number settings with setters and persistence via partialize.

### Layout Selector UI (Task 2)
- **ToggleRow**: Reusable component with label + Switch (iOS green active track)
- **FontSizeSlider**: Custom step-dot track slider using Pressable + `nativeEvent.locationX` for position detection. Steps rendered as small circles with the active step as a larger filled circle. Arabic labels use KFGQPCHafs font.
- **Sections**: Arabic Verse (toggle + font size), Transliteration (toggle only), Translation (toggle + non-interactive source row + font size)
- **Conditional rendering**: Reading options only appear in card modes, hidden in mushaf mode
- **ScrollView**: Wraps all content to handle overflow on smaller screens

### Card View Wiring (Task 3)
- AyahCard now accepts `showArabicVerse`, `arabicFontSize`, `translationFontSize` props
- Arabic text conditionally rendered based on toggle
- Font sizes applied dynamically from settings
- Extracted `CardListItem` as a `React.memo` wrapper to fix VirtualizedList performance warning
- Translation visibility in translation-cards mode respects settings store toggle

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

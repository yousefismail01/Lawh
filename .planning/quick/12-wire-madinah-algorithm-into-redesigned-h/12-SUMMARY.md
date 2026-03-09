---
phase: quick-12
plan: 01
subsystem: hifz
tags: [madinah-method, zustand, setup-wizard, session-card]
dependency_graph:
  requires: [quick-11]
  provides: [madinahHifzStore, MadinahSetup, TodaySession]
  affects: [hub.tsx]
tech_stack:
  added: []
  patterns: [zustand-persist-asyncstorage, multi-step-wizard, tier-card-ui]
key_files:
  created:
    - lawh-mobile/stores/madinahHifzStore.ts
    - lawh-mobile/components/hifz/MadinahSetup.tsx
    - lawh-mobile/components/hifz/TodaySession.tsx
  modified:
    - lawh-mobile/app/(main)/hub.tsx
decisions:
  - Used setTimeout(0) for generateToday after completeSetup to ensure state is saved first
  - Default 5 active days (Sun-Thu) matching common Middle Eastern study schedules
  - All 30 juz selected auto-skips step 2 and sets review-only mode
  - Time estimates: 5 min/page sabaq, 3 min/page sabqi, 2 min/page dhor
  - Kept old HifzSetup import in hub.tsx for reference but stopped rendering it
metrics:
  duration: 249s
  completed: "2026-03-09T04:15:43Z"
  tasks_completed: 2
  tasks_total: 2
---

# Quick Task 12: Wire Madinah Algorithm into Redesigned Hifz Tab Summary

Zustand store bridging pure Madinah-method algorithm to UI, with 3-step setup wizard and daily session card showing Sabaq/Sabqi/Dhor breakdown with page counts and time estimates.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 185fc23 | feat(quick-12): create madinahHifzStore with persisted student state |
| 2 | 8fb2f0f | feat(quick-12): add MadinahSetup wizard, TodaySession card, wire into Hub |

## Task Results

### Task 1: Create madinahHifzStore

Created `lawh-mobile/stores/madinahHifzStore.ts` with:
- AsyncStorage-persisted Zustand store (storage key: `lawh-madinah-hifz`)
- `completeSetup()` saves student profile and triggers session generation
- `generateToday()` builds StudentState from persisted juz numbers, calls `generateDhorCycle` and `generateDailySession`
- `resetSetup()` clears all state back to defaults
- `onRehydrateStorage` regenerates session on app restart
- Only persists: setupComplete, memorizedJuzNumbers, currentSabaqJuz, currentSabaqPage, activeDaysPerWeek, juzQualityScores, dhorDayNumber
- Zero imports from expo-sqlite or hifzService

### Task 2: Create MadinahSetup wizard, TodaySession card, wire Hub

**MadinahSetup** (3-step wizard):
- Step 1: 30-cell juz grid (multi-select, select-all/clear toggle, green fill on selected)
- Step 2: Sabaq juz picker from unselected juz + page picker (1-20) + "only reviewing" option
- Step 3: 7 day circles for active days selection (min 3), summary section, Start button
- All 30 juz selected auto-skips step 2 (review-only mode)

**TodaySession** (session card):
- Header with "Today's Session" title + level badge (L1-L5 pill)
- Three tier rows: Sabaq (green), Sabqi (blue), Dhor (amber) with icons, page ranges, page count pills
- Overdue items flagged on dhor entries with high priority
- Footer with total pages and estimated time
- Loading state when session is null

**Hub wiring:**
- HifzTab gates on `madinahHifzStore.setupComplete` instead of old `settingsStore.hifzSetupComplete`
- Shows MadinahSetup when not configured, TodaySession above existing components when configured
- Calls `generateToday()` in useEffect alongside loadProgress

## Deviations from Plan

None - plan executed exactly as written.

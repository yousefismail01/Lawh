---
phase: quick-12
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lawh-mobile/stores/madinahHifzStore.ts
  - lawh-mobile/components/hifz/MadinahSetup.tsx
  - lawh-mobile/components/hifz/TodaySession.tsx
  - lawh-mobile/app/(main)/hub.tsx
autonomous: true
requirements: [MADINAH-WIRE]

must_haves:
  truths:
    - "New user sees a 3-step setup wizard that captures memorized juz, current sabaq position, and active days"
    - "After setup, the Hifz tab shows today's Madinah session with Sabaq/Sabqi/Dhor breakdown"
    - "Session card shows page counts and estimated time for each tier"
    - "Student level badge (1-5) is visible after setup"
    - "Setup state persists across app restarts via AsyncStorage"
  artifacts:
    - path: "lawh-mobile/stores/madinahHifzStore.ts"
      provides: "Zustand store bridging Madinah algorithm to UI state"
      exports: ["useMadinahHifzStore"]
    - path: "lawh-mobile/components/hifz/MadinahSetup.tsx"
      provides: "3-step setup wizard for Madinah method onboarding"
      exports: ["MadinahSetup"]
    - path: "lawh-mobile/components/hifz/TodaySession.tsx"
      provides: "Today's session card with 3-tier breakdown"
      exports: ["TodaySession"]
  key_links:
    - from: "lawh-mobile/stores/madinahHifzStore.ts"
      to: "lawh-mobile/lib/algorithm/index.ts"
      via: "Calls generateDailySession, generateDhorCycle, getStudentLevel"
      pattern: "generateDailySession|generateDhorCycle|getStudentLevel"
    - from: "lawh-mobile/components/hifz/TodaySession.tsx"
      to: "lawh-mobile/stores/madinahHifzStore.ts"
      via: "Reads todaySession and studentLevel from store"
      pattern: "useMadinahHifzStore"
    - from: "lawh-mobile/app/(main)/hub.tsx"
      to: "lawh-mobile/components/hifz/MadinahSetup.tsx"
      via: "Hifz tab renders MadinahSetup when not configured, TodaySession when configured"
      pattern: "MadinahSetup|TodaySession"
---

<objective>
Wire the Madinah-method algorithm (built in quick-11) into the app by creating a dedicated store, a setup wizard, and a daily session view.

Purpose: The algorithm modules are pure functions with no UI or persistence. This plan bridges them to the React Native app so users can configure their hifz profile and see a daily Sabaq/Sabqi/Dhor session breakdown.

Output: New Zustand store (madinahHifzStore), 3-step setup wizard (MadinahSetup), today's session card (TodaySession), wired into Hub's Hifz tab.
</objective>

<execution_context>
@/Users/yousef/.claude/get-shit-done/workflows/execute-plan.md
@/Users/yousef/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@lawh-mobile/lib/algorithm/types.ts
@lawh-mobile/lib/algorithm/index.ts
@lawh-mobile/lib/algorithm/level-calculator.ts
@lawh-mobile/lib/algorithm/session-generator.ts
@lawh-mobile/lib/algorithm/dhor-scheduler.ts
@lawh-mobile/stores/hifzStore.ts
@lawh-mobile/stores/settingsStore.ts
@lawh-mobile/components/hifz/HifzSetup.tsx
@lawh-mobile/app/(main)/hub.tsx

<interfaces>
<!-- Algorithm public API from lib/algorithm/index.ts -->

```typescript
// Types
export type { StudentLevel, QualityScore, LevelConfig, MemorizedJuz, StudentState,
  DhorCycleEntry, DhorCycle, SabqiAssignment, SabaqAllowance, DailySession, RecoveryPlan } from './types';
export { PAGES_PER_JUZ, TOTAL_JUZ, TOTAL_PAGES, MAX_DHOR_PAGES_PER_DAY,
  QUALITY_THRESHOLD_DHOR, QUALITY_THRESHOLD_SABQI, MAX_MISSED_DAYS } from './types';

// Functions
export { getStudentLevel, getLevelConfig } from './level-calculator';
export { generateDhorCycle, getDhorAssignment } from './dhor-scheduler';
export { getSabqiRange, distributeSabqiWeekly } from './sabqi-manager';
export { shouldThrottleSabaq, getSabaqAllowance } from './sabaq-throttle';
export { generateDailySession } from './session-generator';
export { generateRecoveryPlan } from './recovery';
```

<!-- Existing settings store pattern (persist with AsyncStorage) -->
```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
// settingsStore uses hifzSetupComplete flag to gate setup wizard
```

<!-- Existing hub.tsx pattern -->
```typescript
// HifzTab checks hifzSetupComplete, shows HifzSetup or hifz content
// Uses useResolvedTheme() for isDark, buildColors() for theme colors
// Ionicons for icons
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create madinahHifzStore with persisted student state and session generation</name>
  <files>lawh-mobile/stores/madinahHifzStore.ts</files>
  <action>
    Create a new Zustand store with AsyncStorage persistence that bridges the Madinah algorithm to the UI.

    **State shape:**
    ```typescript
    interface MadinahHifzState {
      // Persisted student profile (set during setup)
      setupComplete: boolean
      memorizedJuzNumbers: number[]      // e.g. [1, 2, 3, 28, 29, 30]
      currentSabaqJuz: number | null     // juz currently being memorized
      currentSabaqPage: number           // page within that juz (1-20)
      activeDaysPerWeek: number          // 3-7
      juzQualityScores: Record<number, number>  // juz -> avg quality (1-5), default 3.5 for new

      // Derived (computed on load, not persisted)
      studentLevel: StudentLevel | null
      todaySession: DailySession | null
      dhorCycle: DhorCycle | null
      dhorDayNumber: number              // tracks position in dhor cycle

      // Actions
      completeSetup: (config: { memorizedJuz: number[], currentSabaqJuz: number | null, currentSabaqPage: number, activeDaysPerWeek: number }) => void
      generateToday: () => void          // recompute today's session
      resetSetup: () => void
      _hasHydrated: boolean
      setHasHydrated: (h: boolean) => void
    }
    ```

    **Implementation details:**
    - Use `zustand/middleware` persist with `createJSONStorage(() => AsyncStorage)`, storage name `'lawh-madinah-hifz'`
    - `partialize` to persist ONLY: setupComplete, memorizedJuzNumbers, currentSabaqJuz, currentSabaqPage, activeDaysPerWeek, juzQualityScores, dhorDayNumber
    - `completeSetup()`: saves config, then calls `generateToday()`
    - `generateToday()`: builds `MemorizedJuz[]` from memorizedJuzNumbers + juzQualityScores (default avgQuality=3.5, lastReviewed=today, pages=20, lapses=0), builds StudentState, calls `generateDhorCycle()`, then `generateDailySession()` with today's date (ISO string), dayOfWeek from `new Date().getDay()`, isActiveDay based on activeDaysPerWeek (first N days of week are active, starting Sunday=0), dhorAvgQuality from mean of juzQualityScores values, consecutiveWeakDhorDays=0 initially
    - `studentLevel` derived via `getStudentLevel(memorizedJuzNumbers.length)` inside `generateToday()`
    - `resetSetup()`: clears all persisted state back to defaults
    - Do NOT import from expo-sqlite or hifzService -- this store uses only the pure algorithm functions
    - Use `onRehydrateStorage` callback to call `generateToday()` after hydration (same pattern as settingsStore's `setHasHydrated`)
  </action>
  <verify>
    <automated>cd /Users/yousef/Documents/Projects/Lawh/lawh-mobile && npx tsc --noEmit stores/madinahHifzStore.ts 2>&1 | head -20</automated>
  </verify>
  <done>
    - Store exports useMadinahHifzStore
    - completeSetup persists student profile and generates today's session
    - generateToday produces a DailySession with sabaq/sabqi/dhor breakdown
    - State persists across app restarts via AsyncStorage
    - No imports from expo-sqlite or hifzService
  </done>
</task>

<task type="auto">
  <name>Task 2: Create MadinahSetup wizard and TodaySession card, wire into Hub Hifz tab</name>
  <files>
    lawh-mobile/components/hifz/MadinahSetup.tsx,
    lawh-mobile/components/hifz/TodaySession.tsx,
    lawh-mobile/app/(main)/hub.tsx
  </files>
  <action>
    **MadinahSetup.tsx** -- 3-step setup wizard replacing HifzSetup:

    Step 1: "What have you memorized?" -- Multi-select grid of 30 juz (5 columns x 6 rows). Each juz is a small pressable square with juz number, toggles selected state. Green fill when selected. Text below: "{N} juz selected". Also show a "Select All" / "Clear" toggle link.

    Step 2: "Where are you memorizing now?" -- If any juz were NOT selected in step 1, show a picker for currentSabaqJuz (list of unselected juz as options, or "I'm only reviewing" option which sets null). If a juz is picked, show a page picker (1-20) for currentSabaqPage. If all 30 selected, auto-set currentSabaqJuz=null (review-only mode) and skip to step 3.

    Step 3: "How many days per week?" -- Horizontal row of 7 day circles (S M T W T F S), tap to toggle active. Count must be >= 3 and <= 7. Show warning text if < 3 selected. "Start" button at bottom.

    On finish: call `useMadinahHifzStore.getState().completeSetup({ memorizedJuz, currentSabaqJuz, currentSabaqPage, activeDaysPerWeek })`.

    Props: `{ isDark: boolean }`. Use buildColors pattern (same as existing HifzSetup). Ionicons only. ScrollView wrapping for smaller screens.

    **TodaySession.tsx** -- Session overview card:

    Props: `{ isDark: boolean }`.

    Reads from `useMadinahHifzStore`: todaySession, studentLevel.

    Layout (vertical card with rounded corners and subtle border):
    - Header row: "Today's Session" title + level badge (e.g., "L3" in a small pill)
    - Three tier rows, each showing:
      - Tier icon + label (Sabaq = book-outline, Sabqi = reload-outline, Dhor = library-outline)
      - Page range text (e.g., "Juz 5, p.3-4") or "Rest day" / "Paused"
      - Page count pill (e.g., "2 pg")
    - Footer: total pages + estimated time (assume ~5 min/page for sabaq, ~3 min/page for sabqi, ~2 min/page for dhor)
    - If todaySession is null, show a loading/empty state

    Colors: green accent for sabaq row, blue for sabqi, amber/orange for dhor. Muted if that tier is empty/null.

    **hub.tsx changes:**
    - Add imports for MadinahSetup and TodaySession
    - In HifzTab: replace `hifzSetupComplete` check with `useMadinahHifzStore((s) => s.setupComplete)`
    - When setupComplete is false: render `<MadinahSetup isDark={isDark} />` instead of old HifzSetup
    - When setupComplete is true: render TodaySession at the top of the hifz content, ABOVE the existing StatsPanel/CurrentlyMemorizing/SurahGrid
    - Keep existing hifz components below TodaySession (they still show ayah-level data from the old store -- coexistence is fine for now)
    - Call `useMadinahHifzStore.getState().generateToday()` in the HifzTab useEffect alongside loadProgress
    - Do NOT remove old HifzSetup import yet (keep for reference), just stop rendering it
  </action>
  <verify>
    <automated>cd /Users/yousef/Documents/Projects/Lawh/lawh-mobile && npx tsc --noEmit components/hifz/MadinahSetup.tsx components/hifz/TodaySession.tsx app/\(main\)/hub.tsx 2>&1 | head -30</automated>
  </verify>
  <done>
    - MadinahSetup renders 3-step wizard with juz grid, sabaq picker, and active days selector
    - TodaySession shows sabaq/sabqi/dhor breakdown with page counts and time estimate
    - Hub Hifz tab gates on madinahHifzStore.setupComplete
    - TodaySession appears above existing hifz components after setup
    - Dark mode works on all new components
    - No runtime errors (TypeScript compiles clean)
  </done>
</task>

</tasks>

<verification>
```bash
# TypeScript compiles
cd lawh-mobile && npx tsc --noEmit 2>&1 | grep -c "error" | xargs -I{} test {} -eq 0

# New store has no SQLite dependencies
grep -r "expo-sqlite\|hifzService" stores/madinahHifzStore.ts && echo "FAIL" || echo "PASS"

# New components exist and export correctly
grep "export" components/hifz/MadinahSetup.tsx components/hifz/TodaySession.tsx

# Hub imports new components
grep "MadinahSetup\|TodaySession\|madinahHifzStore" app/\(main\)/hub.tsx
```
</verification>

<success_criteria>
- madinahHifzStore bridges the pure algorithm to the UI with AsyncStorage persistence
- 3-step setup wizard captures memorized juz (multi-select grid), current sabaq position, and active days
- Today's session card shows Sabaq/Sabqi/Dhor breakdown with page counts and estimated time
- Hub Hifz tab gates on new store's setupComplete, shows TodaySession above existing components
- Dark mode supported on all new UI
- TypeScript compiles without errors
- Old hifz components coexist (not removed, just augmented)
</success_criteria>

<output>
After completion, create `.planning/quick/12-wire-madinah-algorithm-into-redesigned-h/12-SUMMARY.md`
</output>

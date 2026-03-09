---
phase: quick-13
plan: 13
type: execute
wave: 1
depends_on: []
files_modified:
  - lawh-mobile/lib/algorithm/half-page.ts
  - lawh-mobile/lib/algorithm/half-page.test.ts
  - lawh-mobile/lib/algorithm/ayah-line-map.ts
  - lawh-mobile/lib/algorithm/types.ts
  - lawh-mobile/lib/algorithm/session-generator.ts
  - lawh-mobile/lib/algorithm/index.ts
  - lawh-mobile/stores/madinahHifzStore.ts
autonomous: true
requirements: [QUICK-13]

must_haves:
  truths:
    - "Half-page calculator returns ayah-bounded memorization units of ~7-8 lines"
    - "Round-down mode ends at last complete ayah before line 8; round-up includes ayah spanning midpoint"
    - "Session generator uses concrete ayah ranges instead of abstract 0.5-page units"
    - "Surah headers and basmallah lines are excluded from the line count toward the ~7-8 target"
    - "Long ayahs spanning >10 lines are capped with a warning flag"
    - "Juz 30 short surahs produce whole-surah units instead of splitting"
  artifacts:
    - path: "lawh-mobile/lib/algorithm/ayah-line-map.ts"
      provides: "Derives ayah-to-line mapping from existing layout DB + words JSON"
      exports: ["buildPageAyahLayout", "PageAyahLayout", "AyahLineRange"]
    - path: "lawh-mobile/lib/algorithm/half-page.ts"
      provides: "Half-page calculator with round_down and round_up modes"
      exports: ["calculateHalfPage", "MemorizationUnit", "HalfPageSettings"]
    - path: "lawh-mobile/lib/algorithm/half-page.test.ts"
      provides: "TDD tests for half-page calculator"
  key_links:
    - from: "lawh-mobile/lib/algorithm/half-page.ts"
      to: "lawh-mobile/lib/algorithm/ayah-line-map.ts"
      via: "import PageAyahLayout"
      pattern: "import.*PageAyahLayout.*ayah-line-map"
    - from: "lawh-mobile/lib/algorithm/session-generator.ts"
      to: "lawh-mobile/lib/algorithm/half-page.ts"
      via: "import calculateHalfPage for sabaq assignment"
      pattern: "import.*calculateHalfPage.*half-page"
---

<objective>
Add half-page memorization units to the Madinah-method hifz algorithm. Currently the algorithm assigns "pages" (abstract 1-20 within a juz) for sabaq. This plan replaces those abstract page units with concrete ayah-bounded memorization units of ~7-8 lines, snapped to ayah boundaries in the 15-line Madinah mushaf.

Purpose: Students memorize in natural ayah-bounded chunks (e.g., "Al-Isra, ayat 78-84") rather than arbitrary page halves. This matches how teachers assign memorization in traditional Madinah-method hifz.

Output: Pure TypeScript half-page calculator with tests, wired into the existing session generator.
</objective>

<execution_context>
@/Users/yousef/.claude/get-shit-done/workflows/execute-plan.md
@/Users/yousef/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lawh-mobile/lib/algorithm/types.ts
@lawh-mobile/lib/algorithm/session-generator.ts
@lawh-mobile/lib/algorithm/level-calculator.ts
@lawh-mobile/lib/algorithm/surah-boundaries.ts
@lawh-mobile/lib/algorithm/dhor-scheduler.ts
@lawh-mobile/lib/algorithm/sabaq-throttle.ts
@lawh-mobile/stores/madinahHifzStore.ts
@lawh-mobile/services/quranService.ts
@lawh-mobile/lib/data/contentsData.ts

<interfaces>
<!-- Key types and contracts the executor needs -->

From lawh-mobile/lib/algorithm/types.ts:
```typescript
export type StudentLevel = 1 | 2 | 3 | 4 | 5;
export interface StudentState {
  memorizedJuz: MemorizedJuz[];
  currentSabaqJuz: number | null;
  currentSabaqPage: number;
  activeDaysPerWeek: number;
  totalPagesMemorized: number;
  sabaqPagesOverride?: number | null;
}
export interface DailySession {
  sabaq: { juz: number; startPage: number; endPage: number } | null;
  sabqi: SabqiAssignment[];
  dhor: DhorCycleEntry[];
  totalPages: number;
  sessionDate: string;
}
export const PAGES_PER_JUZ = 20;
```

From layout DB schema (qpc-v4-layout.db):
```sql
CREATE TABLE pages (
  page_number INTEGER,  -- mushaf page 1-604
  line_number INTEGER,  -- line 1-15
  line_type TEXT,        -- 'ayah' | 'surah_name' | 'basmallah'
  is_centered INTEGER,
  first_word_id INTEGER,
  last_word_id INTEGER,
  surah_number INTEGER  -- only set for surah_name lines
);
```

From qpc-v4-words.json structure (word entries):
```typescript
interface WordEntry {
  id: number;       // word ID (matches first_word_id/last_word_id in DB)
  surah: string;    // e.g., "17"
  ayah: string;     // e.g., "78"
  word: string;     // word position in ayah
  location: string; // "17:78:3"
  text: string;     // PUA glyph
}
```

From level-calculator.ts:
```typescript
// Level configs have sabaqPagesPerDay: 1, 1, 0.75, 0.5, 0 for levels 1-5
// 0.5 pages = one half-page unit, 1 page = two half-page units
export function getStudentLevel(totalJuz: number): StudentLevel;
export function getLevelConfig(level: StudentLevel): LevelConfig;
```

JUZ_START_PAGES from pageJuzHizb.ts maps juz 1-30 to mushaf page numbers.
SURAH_START_PAGES from contentsData.ts maps surah 1-114 to mushaf page numbers.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Build ayah-line mapping and half-page calculator with tests</name>
  <files>
    lawh-mobile/lib/algorithm/ayah-line-map.ts,
    lawh-mobile/lib/algorithm/half-page.ts,
    lawh-mobile/lib/algorithm/half-page.test.ts,
    lawh-mobile/lib/algorithm/types.ts
  </files>
  <behavior>
    - buildPageAyahLayout(page): returns ordered list of {surahId, ayahNumber, lineStart, lineEnd} for each ayah on the page, derived from layout DB word IDs cross-referenced with words JSON
    - Non-ayah lines (surah_name, basmallah) are excluded from ayah ranges but tracked as metadata (headerLines count)
    - calculateHalfPage(mushafPage, halfIndex 0|1, mode 'round_down'|'round_up', pageLayout): returns MemorizationUnit with {surahId, surahName, startAyah, endAyah, lineCount, mushafPage, halfIndex, isLongAyah}
    - round_down: target line 7-8 midpoint, end at last ayah that completes before or at line 8
    - round_up: include the ayah that spans the midpoint
    - Long ayah (>10 lines): single-ayah unit with isLongAyah=true warning flag
    - First half (halfIndex=0): lines 1-~8 (accounting for headers); second half (halfIndex=1): remaining lines
    - When page has surah header on line 1 + basmallah on line 2, effective ayah lines start at 3, so first half targets ~7-8 ayah-content lines starting from line 3
    - Juz 30 short surahs: if entire surah fits on <8 lines, return whole surah as single unit
  </behavior>
  <action>
    **Step 1: Add new types to types.ts**

    Add to the bottom of types.ts (do NOT modify existing types):
    ```typescript
    /** Position of an ayah within a mushaf page's 15-line grid */
    export interface AyahLineRange {
      surahId: number;
      ayahNumber: number;
      lineStart: number;  // 1-15
      lineEnd: number;    // 1-15
      lineCount: number;
    }

    /** Layout of a single mushaf page with ayah positions */
    export interface PageAyahLayout {
      page: number;
      ayahs: AyahLineRange[];
      /** Number of non-ayah header lines (surah_name + basmallah) */
      headerLines: number;
      /** Total ayah-content lines (15 minus headers) */
      contentLines: number;
    }

    /** A concrete memorization unit bounded by ayah numbers */
    export interface MemorizationUnit {
      surahId: number;
      surahName: string;
      startAyah: number;
      endAyah: number;
      /** Mushaf page this unit is on */
      mushafPage: number;
      /** 0 = first half, 1 = second half */
      halfIndex: 0 | 1;
      /** Number of actual content lines */
      lineCount: number;
      /** True if a single ayah spans >10 lines */
      isLongAyah: boolean;
    }

    /** Ayah boundary snapping mode */
    export type AyahBoundaryMode = 'round_down' | 'round_up';

    /** Half-page settings for the memorization algorithm */
    export interface HalfPageSettings {
      ayahBoundaryMode: AyahBoundaryMode;
      /** Number of half-pages to memorize per day */
      dailyHalfPages: number;
    }
    ```

    **Step 2: Create ayah-line-map.ts**

    Pure TypeScript module that builds PageAyahLayout from the existing data:
    - Import wordsJson from `@/assets/qpc-v4-words.json` and build a wordId-to-{surah,ayah} lookup (same pattern as quranService.ts)
    - Import layout DB access via `openLayoutDb()` pattern from quranService.ts (or extract shared helper)
    - `buildPageAyahLayout(page: number)`: Query layout DB for all lines on the page. For each ayah-type line, look up the first_word_id in the words map to get surahId:ayahNumber. Group consecutive lines with the same surah:ayah into a single AyahLineRange. Count surah_name and basmallah lines as headerLines.
    - IMPORTANT: This function needs the layout DB (async). Provide both async version (uses DB) and a synchronous version that accepts pre-fetched line data: `buildPageAyahLayoutFromLines(page: number, lines: {line_number: number, line_type: string, first_word_id: number, surah_number?: number}[]): PageAyahLayout`
    - The synchronous version is what the half-page calculator and tests will use.
    - Export a `preloadPageLayouts(pages: number[]): Promise<Map<number, PageAyahLayout>>` for batch loading.

    **Step 3: Create half-page.ts**

    Pure synchronous function (no DB, no async — receives PageAyahLayout as input):
    - `calculateHalfPage(layout: PageAyahLayout, halfIndex: 0 | 1, mode: AyahBoundaryMode): MemorizationUnit`
    - Compute the midpoint line: `Math.ceil(layout.contentLines / 2)` offset by headerLines
    - For halfIndex=0: collect ayahs from first content line up to midpoint
      - round_down: include only ayahs whose lineEnd <= midpointLine
      - round_up: include ayahs whose lineStart <= midpointLine (even if lineEnd > midpointLine)
    - For halfIndex=1: remaining ayahs after the first half
    - Look up surahName from chapters import (same as surah-boundaries.ts pattern)
    - Handle edge cases:
      - If only 1 ayah on the page (long ayah): return it as a single unit with isLongAyah=true
      - If a surah starts mid-page (has header+basmallah mid-page), adjust contentLines accordingly
      - Cross-surah pages: if the half spans two surahs, use the first surah's ID/name for the unit (the UI can show both)

    **Step 4: Write tests (RED first, then GREEN)**

    Test file: `lawh-mobile/lib/algorithm/half-page.test.ts` (note: NOT in __tests__ subdirectory, follow the existing dhor-scheduler test pattern which IS in __tests__... actually check: the existing test is at `lib/algorithm/__tests__/dhor-scheduler.test.ts`). Place tests at `lawh-mobile/lib/algorithm/__tests__/half-page.test.ts`.

    Tests should use mock PageAyahLayout data (no DB needed):
    - Test 1: Standard 15-line page with 10 ayahs, round_down halfIndex=0 returns ~first 5 ayahs
    - Test 2: Same page round_up halfIndex=0 includes ayah spanning midpoint
    - Test 3: halfIndex=1 returns complement of halfIndex=0
    - Test 4: Page with surah header (2 header lines) adjusts midpoint correctly
    - Test 5: Single long ayah spanning 12 lines returns isLongAyah=true
    - Test 6: Juz 30 short surah (3 lines total) returns whole surah as one unit
    - Test 7: round_down and round_up produce same result when ayah boundary falls exactly on midpoint
  </action>
  <verify>
    <automated>cd /Users/yousef/Documents/Projects/Lawh/lawh-mobile && npx jest half-page --no-coverage 2>&1 | tail -20</automated>
  </verify>
  <done>
    - AyahLineRange, PageAyahLayout, MemorizationUnit, AyahBoundaryMode, HalfPageSettings types exported from types.ts
    - ayah-line-map.ts builds page layouts from existing DB + words data
    - half-page.ts calculateHalfPage returns correct units for all modes and edge cases
    - All tests pass (7+ test cases covering round_down, round_up, headers, long ayahs, short surahs)
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire half-page calculator into session generator and store</name>
  <files>
    lawh-mobile/lib/algorithm/session-generator.ts,
    lawh-mobile/lib/algorithm/index.ts,
    lawh-mobile/stores/madinahHifzStore.ts
  </files>
  <action>
    **Step 1: Update DailySession type and session-generator.ts**

    Add an optional `sabaqUnit` field to the DailySession interface in types.ts:
    ```typescript
    export interface DailySession {
      sabaq: { juz: number; startPage: number; endPage: number } | null;
      /** Concrete ayah-bounded memorization unit for sabaq (when half-page mode active) */
      sabaqUnit?: MemorizationUnit | null;
      sabqi: SabqiAssignment[];
      dhor: DhorCycleEntry[];
      totalPages: number;
      sessionDate: string;
    }
    ```

    In session-generator.ts, after the existing sabaq assignment logic (lines 94-105), add half-page resolution:
    - Import `calculateHalfPage` from `./half-page` and `buildPageAyahLayoutFromLines` from `./ayah-line-map`
    - When sabaq is assigned and `sabaqPagesOverride` is a 0.5-increment (i.e., includes a half page), compute the concrete MemorizationUnit
    - The current code computes sabaq as `{juz, startPage, endPage}` using juz-relative pages. Convert to mushaf pages using `JUZ_START_PAGES[juz-1] + startPage - 1`
    - For a 0.5-page assignment: call `calculateHalfPage(layout, 0, 'round_down')` (default mode)
    - For a 1-page assignment: produce two half-page units covering the full page
    - Add `sabaqUnit` to the returned DailySession
    - IMPORTANT: The half-page calculator needs PageAyahLayout which requires DB access (async). Since generateDailySession is synchronous, make the sabaqUnit resolution lazy: add it as null in the sync function, and provide a separate `async resolveSabaqUnit(session: DailySession, mode: AyahBoundaryMode): Promise<MemorizationUnit | null>` exported function that the store can call after generation
    - This keeps the pure sync design of the algorithm layer intact

    **Step 2: Export new functions from index.ts**

    Add exports for `calculateHalfPage`, `MemorizationUnit`, `HalfPageSettings`, `AyahBoundaryMode`, `resolveSabaqUnit`, `buildPageAyahLayout`, `preloadPageLayouts`.

    **Step 3: Update madinahHifzStore.ts**

    Add to MadinahHifzState:
    - `ayahBoundaryMode: AyahBoundaryMode` (default: `'round_down'`)
    - `sabaqUnit: MemorizationUnit | null` (derived, not persisted)
    - `setAyahBoundaryMode: (mode: AyahBoundaryMode) => void`

    In `generateToday()`, after generating the session, call `resolveSabaqUnit()` asynchronously and update state:
    ```typescript
    // After set({ todaySession, ... })
    if (todaySession.sabaq) {
      resolveSabaqUnit(todaySession, state.ayahBoundaryMode).then(unit => {
        set({ sabaqUnit: unit });
      });
    } else {
      set({ sabaqUnit: null });
    }
    ```

    Add `ayahBoundaryMode` to partialize (persisted). Do NOT persist `sabaqUnit` (derived on load).

    **Step 4: Wire sabaqPagesOverride to support 0.5 increments**

    The existing `sabaqPagesOverride` already supports 0.5 increments (per types.ts comment: "0.5 increments"). The half-page system now gives concrete meaning to 0.5: one half-page memorization unit. No changes needed to the override mechanism — just ensure the session-generator correctly interprets 0.5 as "one half page" when resolving the sabaqUnit.
  </action>
  <verify>
    <automated>cd /Users/yousef/Documents/Projects/Lawh/lawh-mobile && npx tsc --noEmit 2>&1 | tail -20</automated>
  </verify>
  <done>
    - DailySession has optional sabaqUnit field
    - resolveSabaqUnit async function converts page-based sabaq to ayah-bounded MemorizationUnit
    - madinahHifzStore.generateToday() resolves sabaqUnit after session generation
    - ayahBoundaryMode setting persisted in store with setter
    - TypeScript compiles with no errors
    - Existing algorithm tests still pass
  </done>
</task>

</tasks>

<verification>
1. `cd lawh-mobile && npx jest half-page --no-coverage` — all half-page calculator tests pass
2. `cd lawh-mobile && npx jest --no-coverage` — all existing algorithm tests still pass
3. `cd lawh-mobile && npx tsc --noEmit` — no TypeScript errors
4. Manual spot check: for mushaf page 282 (Al-Isra start), buildPageAyahLayout returns 13 ayah-content lines (15 total minus 1 surah_name minus 1 basmallah), and calculateHalfPage(layout, 0, 'round_down') returns a unit with ~6-7 lines of ayahs
</verification>

<success_criteria>
- Half-page calculator produces ayah-bounded memorization units for any mushaf page
- Both round_down and round_up modes work correctly
- Edge cases handled: surah headers, long ayahs, short surahs, cross-page ayahs
- Session generator optionally resolves sabaq assignments to concrete ayah ranges
- Store exposes sabaqUnit for UI consumption
- All tests pass, TypeScript compiles clean
</success_criteria>

<output>
After completion, create `.planning/quick/13-half-page-memorization-units-in-the-15-l/13-SUMMARY.md`
</output>

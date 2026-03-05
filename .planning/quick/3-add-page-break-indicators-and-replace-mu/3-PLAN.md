---
phase: quick
plan: 3
type: execute
wave: 1
depends_on: []
files_modified:
  - lawh-mobile/components/mushaf/CardView.tsx
  - lawh-mobile/components/mushaf/MushafPageHeader.tsx
autonomous: true
requirements: []
---

<objective>
1. Add page break indicators between ayahs at Mushaf page boundaries in CardView (arabic-cards and translation-cards modes)
2. Add inline surah headers (banner + basmallah + surah name) in CardView before first ayah of each surah — no translation for these elements
3. Replace MushafPageHeader (Madani-style with hizb quarter icon) with the same simple header style used in CardView: surahName | page | Part N

Purpose: Consistent header across all views, page context while scrolling in card mode, and surah boundary markers with basmallah/banner in all views.
</objective>

<execution_context>
@/Users/yousef/.claude/get-shit-done/workflows/execute-plan.md
@/Users/yousef/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lawh-mobile/components/mushaf/CardView.tsx
@lawh-mobile/components/mushaf/MushafPageHeader.tsx
@lawh-mobile/components/mushaf/MushafSurahBanner.tsx
@lawh-mobile/components/mushaf/MushafBismillah.tsx
@lawh-mobile/lib/data/mushafData.ts (chapters record)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add page break indicators and inline surah headers in CardView</name>
  <files>lawh-mobile/components/mushaf/CardView.tsx</files>
  <action>
Modify CardView to insert page break separators and surah header items into the FlatList.

1. Add discriminated union types:
   - Add `type: 'ayah'` to AyahItem interface
   - Add `PageBreakItem = { type: 'page-break'; page: number; key: string }`
   - Add `SurahHeaderItem = { type: 'surah-header'; surahId: number; key: string }`
   - Create union: `type ListItem = AyahItem | PageBreakItem | SurahHeaderItem`

2. Set `type: 'ayah'` when creating items in `loadSurahRange`

3. Create a `useMemo` that builds the mixed list from `ayahItems`:
   - Before the first ayah of each surah (when surahId changes or is the first item), insert a `SurahHeaderItem`
   - After each ayah whose `page` differs from the next ayah's `page`, insert a `PageBreakItem` with the NEW page number

4. Update `renderItem` to handle all 3 types:
   - `'page-break'`: Horizontal line with centered page number
     - `View` with `flexDirection: 'row'`, `alignItems: 'center'`, `marginVertical: 16`, `paddingHorizontal: 20`
     - Left/right lines: `View` with `flex: 1`, `height: StyleSheet.hairlineWidth`, dark-aware bg
     - Center: `Text` showing page number, `fontSize: 12`, muted color
   - `'surah-header'`: Inline surah header block
     - Import and render `MushafSurahBanner` for the ornate banner with surah name glyph
     - Below banner, render `MushafBismillah` if `chapters[surahId].bismillahPre` is true (skip for surah 1 and 9)
     - Container: `alignItems: 'center'`, `paddingVertical: 12`, `paddingHorizontal: 20`
     - Banner height: ~60, Bismillah height: ~50
   - `'ayah'`: Existing AyahCard rendering (unchanged)

5. Update `keyExtractor` to use `item.key` (already works for all types)

6. Update `onViewableItemsChanged` to skip non-ayah items (check `item.type === 'ayah'` before accessing surahId/page)

7. Update FlatList `data` prop to use the mixed list, and type the FlatList as `FlatList<ListItem>`
  </action>
  <verify>
    <automated>cd /Users/yousef/Documents/Projects/Lawh/lawh-mobile && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>CardView shows page break separators at page boundaries and surah headers with banner + basmallah before each surah. TypeScript compiles.</done>
</task>

<task type="auto">
  <name>Task 2: Replace MushafPageHeader with simple header matching CardView style</name>
  <files>lawh-mobile/components/mushaf/MushafPageHeader.tsx</files>
  <action>
Replace the Madani-style header (surah name left, juz + hizb quarter icon right) with the same simple 3-column layout used in CardView's sticky header: surahName | page | Part N.

1. Simplify MushafPageHeaderProps — remove `hizb` and `quarter` (no longer needed)
2. Remove the `HizbQuarterIcon` component entirely
3. Replace the container with a simple 3-column row:
   - Left: `Text` showing `surahNameSimple` (fontSize 14, fontWeight 500)
   - Center: `Text` showing `pageNumber` (fontSize 14, fontWeight 500)
   - Right: `Text` showing `Part {juz}` (fontSize 14, fontWeight 500)
   - All with muted color: `#666` (matches CardView `headerTextColor`)
4. Keep the bottom hairline separator
5. Update MushafPage.tsx to remove `hizb` and `quarter` props from MushafPageHeader usage (just pass surahNameSimple, juz, pageNumber)
  </action>
  <verify>
    <automated>cd /Users/yousef/Documents/Projects/Lawh/lawh-mobile && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>MushafPageHeader shows the same simple 3-column layout as CardView: surahName | page | Part N. No hizb quarter icon. TypeScript compiles.</done>
</task>

</tasks>

<verification>
- Open app in card view mode and scroll — page break indicators appear at page boundaries with correct page numbers
- Surah headers with ornate banner and basmallah appear before each surah's first ayah
- Open mushaf page view — header now shows simple surahName | page | Part N layout
- Dark mode renders correctly for all new elements
</verification>

<output>
After completion, create `.planning/quick/3-add-page-break-indicators-and-replace-mu/3-SUMMARY.md`
</output>

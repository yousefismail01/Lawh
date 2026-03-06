---
phase: quick-8
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - lawh-mobile/stores/settingsStore.ts
  - lawh-mobile/app/(main)/quran-settings.tsx
autonomous: true
requirements: [QS-01, QS-02, QS-03, QS-04, QS-05]
must_haves:
  truths:
    - "User can toggle scroll direction between Horizontal and Vertical"
    - "User can select page design between Fullscreen and Book"
    - "User can select landscape layout between Single and Double"
    - "User can pick banner theme with cropped SVG left-half previews"
    - "User can toggle thematic highlighting on/off"
    - "All settings persist across app restarts"
  artifacts:
    - path: "lawh-mobile/stores/settingsStore.ts"
      provides: "New settings: pageDesign, landscapeLayout, thematicHighlighting with types, defaults, setters, persistence"
    - path: "lawh-mobile/app/(main)/quran-settings.tsx"
      provides: "Full Quran settings page with 5 sections matching design reference"
  key_links:
    - from: "lawh-mobile/app/(main)/quran-settings.tsx"
      to: "lawh-mobile/stores/settingsStore.ts"
      via: "useSettingsStore selectors for all 5 settings"
      pattern: "useSettingsStore"
    - from: "lawh-mobile/app/(main)/quran-settings.tsx"
      to: "lawh-mobile/components/mushaf/BlueSurahBanner.tsx"
      via: "buildOrnamentSvg + VECTOR_THEMES for theme previews"
      pattern: "buildOrnamentSvg|VECTOR_THEMES"
---

<objective>
Redesign the Quran settings page to match the reference design with 5 sections: Scroll Direction, Page Design, Landscape Layout, Theme (with cropped left-half SVG previews), and Thematic Highlighting toggle. Add missing settings to the store.

Purpose: Replace the current minimal banner-theme-only settings page with a full-featured Quran reading configuration screen.
Output: Fully styled quran-settings.tsx with warm cream background, card-based sections, green checkmarks, and all new settings persisted via settingsStore.
</objective>

<execution_context>
@/Users/yousef/.claude/get-shit-done/workflows/execute-plan.md
@/Users/yousef/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lawh-mobile/stores/settingsStore.ts
@lawh-mobile/app/(main)/quran-settings.tsx
@lawh-mobile/components/mushaf/BlueSurahBanner.tsx

<interfaces>
From lawh-mobile/stores/settingsStore.ts:
```typescript
export type BannerTheme = 'bw' | 'classic' | 'blue' | 'pink'
export type ReadingMode = 'mushaf' | 'arabic-cards' | 'translation-cards'
// Existing settings: navigationMode ('horizontal'|'vertical'), bannerTheme, tajweedEnabled, etc.
// Uses zustand persist with AsyncStorage, partialize excludes _hasHydrated
```

From lawh-mobile/components/mushaf/BlueSurahBanner.tsx:
```typescript
export function buildOrnamentSvg(outline: string, base: string, accent: string): string
export const VECTOR_THEMES: Record<string, { outline: string; base: string; accent: string }>
// VECTOR_THEMES has keys: bw, blue, pink (NOT classic - classic uses QuranCommon font)
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add new settings to settingsStore</name>
  <files>lawh-mobile/stores/settingsStore.ts</files>
  <action>
Add three new settings to the SettingsState interface and store implementation:

1. `pageDesign: 'fullscreen' | 'book'` — export the type as `PageDesign`. Default: `'fullscreen'`
2. `landscapeLayout: 'single' | 'double'` — export the type as `LandscapeLayout`. Default: `'double'`
3. `thematicHighlighting: boolean` — Default: `false`

For each, add:
- The field to SettingsState interface
- A setter method: `setPageDesign`, `setLandscapeLayout`, `setThematicHighlighting`
- Default value in the store creator
- Setter implementation: `setPageDesign: (pageDesign) => set({ pageDesign })` etc.
- Add to the `partialize` function so they persist to AsyncStorage

Keep all existing settings untouched. Follow the exact same pattern as existing settings (e.g., `setNavigationMode`).
  </action>
  <verify>
    <automated>cd /Users/yousef/Documents/Projects/Lawh/lawh-mobile && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>settingsStore exports PageDesign, LandscapeLayout types. All 3 new settings have defaults, setters, and are included in partialize for persistence.</done>
</task>

<task type="auto">
  <name>Task 2: Rewrite quran-settings.tsx with full 5-section design</name>
  <files>lawh-mobile/app/(main)/quran-settings.tsx</files>
  <action>
Completely rewrite quran-settings.tsx to match the reference design. Use ScrollView for the page content.

**Global styles:**
- Background: warm cream `#F5F0E8`
- Header: `"< Settings"` pressable text on left (calls router.back()), `"Quran"` centered title, no right element. Header bg matches page bg. No border.
- Section titles: muted gold/brown `#9C8D6E`, uppercase, fontSize 12, fontWeight '600', letterSpacing 1.2, marginBottom 8, marginTop 20 (except first section marginTop 12)
- Cards: white `#FFFFFF` background, borderRadius 12, no border/shadow
- Rows inside cards: paddingHorizontal 16, paddingVertical 14, flexDirection 'row', alignItems 'center'
- Hairline separator between rows: `{ height: StyleSheet.hairlineWidth, backgroundColor: '#E8E0D4', marginLeft: 16 }`
- Row icon: Ionicons, size 20, color `#6B5D45`, marginRight 12
- Row label: fontSize 16, color `#2C2418`, flex 1
- Green checkmark on selected rows: Ionicons `checkmark` (not checkmark-circle), size 20, color `#4CAF50`

**Section 1 — SCROLL DIRECTION** (maps to `navigationMode`):
- Row 1: icon `swap-horizontal-outline`, label "Horizontal", selected when navigationMode === 'horizontal'
- Row 2: icon `swap-vertical-outline`, label "Vertical", selected when navigationMode === 'vertical'
- onPress calls `setNavigationMode('horizontal')` or `setNavigationMode('vertical')`

**Section 2 — PAGE DESIGN** (maps to new `pageDesign`):
- Row 1: icon `expand-outline`, label "Fullscreen", selected when pageDesign === 'fullscreen'
- Row 2: icon `book-outline`, label "Book", selected when pageDesign === 'book'

**Section 3 — LANDSCAPE LAYOUT** (maps to new `landscapeLayout`):
- Row 1: icon `tablet-portrait-outline`, label "Single", selected when landscapeLayout === 'single'
- Row 2: icon `tablet-landscape-outline`, label "Double", selected when landscapeLayout === 'double'

**Section 4 — THEME** (maps to existing `bannerTheme`):
Four rows, one per theme: bw ("Black and White"), classic ("Classic"), blue ("Blue"), pink ("Pink").

Each row layout: left side has a preview container (width 80, height 48, borderRadius 8, overflow 'hidden'), then label text, then green checkmark if selected.

**Theme preview rendering:**
- For bw, blue, pink: Use `buildOrnamentSvg` with `VECTOR_THEMES[key]` colors. Render `<SvgXml>` with width={160} height={160 / (8240/1033)} inside the 80x48 container. The container has `overflow: 'hidden'` so only the LEFT HALF of the SVG is visible, making the ornament detail large and visible. The SVG should be aligned to the left (no centering).
- For classic: Render a dark background container (`#2A3A2A`) with the QuranCommon font `header` ligature in gold (`#C9A84C`), fontSize 28. This is the classic ornamental header rendered as text.

The preview container should have a subtle border: `{ borderWidth: 1, borderColor: '#E8E0D4' }`.

Gap between preview and label: marginLeft 12.

**Section 5 — THEMATIC HIGHLIGHTING:**
- Single row in a card, no section title above (or use "THEMATIC HIGHLIGHTING" as section title)
- Left side: icon `color-wand-outline`, then column with title "Thematic Highlighting" (fontSize 16, color `#2C2418`) and description "Highlight verses on the same topic to help with memorization" (fontSize 13, color `#9C8D6E`, marginTop 2)
- Right side: React Native `Switch` component with trackColor={{ false: '#D4C9B8', true: '#4CAF50' }}, thumbColor '#FFFFFF', value={thematicHighlighting}, onValueChange={setThematicHighlighting}

**Store selectors:** Read all needed values with individual selectors to avoid unnecessary rerenders:
```typescript
const navigationMode = useSettingsStore((s) => s.navigationMode)
const setNavigationMode = useSettingsStore((s) => s.setNavigationMode)
const pageDesign = useSettingsStore((s) => s.pageDesign)
const setPageDesign = useSettingsStore((s) => s.setPageDesign)
// ... etc for all 5 settings
```

Import `buildOrnamentSvg` and `VECTOR_THEMES` from `@/components/mushaf/BlueSurahBanner`.
Import `Switch` from `react-native`.
Import `SvgXml` from `react-native-svg`.

Create a reusable `SettingRow` component inline for the radio-style rows to reduce repetition. It should accept: icon (Ionicons name), label (string), selected (boolean), onPress (callback), and optionally a preview ReactNode.

Add bottom padding (paddingBottom: 40) to ScrollView contentContainer for comfortable scrolling.
  </action>
  <verify>
    <automated>cd /Users/yousef/Documents/Projects/Lawh/lawh-mobile && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>Quran settings page renders all 5 sections with correct styling. Scroll Direction maps to navigationMode, Page Design to pageDesign, Landscape Layout to landscapeLayout, Theme to bannerTheme with cropped left-half SVG previews, and Thematic Highlighting toggle to thematicHighlighting. All selections show green checkmarks, warm cream background throughout.</done>
</task>

</tasks>

<verification>
- TypeScript compiles without errors: `cd lawh-mobile && npx tsc --noEmit`
- Open app, navigate to Settings > Quran section
- All 5 sections visible and scrollable
- Tapping rows updates checkmark positions
- Theme previews show left-half cropped SVGs (bw/blue/pink) and classic font preview
- Toggle switch works for thematic highlighting
- Kill and reopen app: all selections persist
</verification>

<success_criteria>
- settingsStore has pageDesign, landscapeLayout, thematicHighlighting with types, defaults, setters, persistence
- quran-settings.tsx renders 5 sections matching reference design: cream bg, white cards, green checkmarks, cropped SVG theme previews
- All settings read from and write to settingsStore
- TypeScript compiles cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/8-redesign-quran-settings-page-with-scroll/8-SUMMARY.md`
</output>

---
phase: quick
plan: 9
type: execute
wave: 1
depends_on: []
files_modified:
  - lawh-mobile/stores/settingsStore.ts
  - lawh-mobile/hooks/useResolvedTheme.ts
  - lawh-mobile/app/(main)/quran-settings.tsx
  - lawh-mobile/components/mushaf/MushafFrame.tsx
  - lawh-mobile/components/mushaf/MushafPage.tsx
  - lawh-mobile/components/mushaf/MushafScreen.tsx
  - lawh-mobile/components/mushaf/MushafPageHeader.tsx
  - lawh-mobile/components/mushaf/MushafBismillah.tsx
autonomous: true
requirements: [QUICK-9]

must_haves:
  truths:
    - "User can select Auto/Light/Dark theme mode in Quran settings"
    - "Light mode shows White or Beige variant based on user choice"
    - "Dark mode shows True Black or Navy variant based on user choice"
    - "Auto mode follows system theme, using chosen light/dark variants"
    - "Mushaf text color adapts to light/dark (black text on light, white text on dark)"
    - "Theme preference persists across app restarts"
  artifacts:
    - path: "lawh-mobile/hooks/useResolvedTheme.ts"
      provides: "Centralized theme resolution hook"
      exports: ["useResolvedTheme"]
    - path: "lawh-mobile/stores/settingsStore.ts"
      provides: "Theme state with AppThemeMode, LightVariant, DarkVariant types"
      contains: "appThemeMode"
  key_links:
    - from: "lawh-mobile/hooks/useResolvedTheme.ts"
      to: "lawh-mobile/stores/settingsStore.ts"
      via: "zustand selectors for appThemeMode, lightVariant, darkVariant"
      pattern: "useSettingsStore"
    - from: "lawh-mobile/components/mushaf/MushafPage.tsx"
      to: "lawh-mobile/hooks/useResolvedTheme.ts"
      via: "hook import for text/bg colors"
      pattern: "useResolvedTheme"
---

<objective>
Add app theme settings (Auto/Light/Dark) with light sub-options (White/Beige) and dark sub-options (True Black/Navy). Wire theme throughout mushaf rendering components.

Purpose: Allow users to customize the Quran reading experience with different background/text color schemes, including system-following auto mode.
Output: New APPEARANCE section in quran-settings, useResolvedTheme hook, theme-aware mushaf components.
</objective>

<execution_context>
@/Users/yousef/.claude/get-shit-done/workflows/execute-plan.md
@/Users/yousef/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lawh-mobile/stores/settingsStore.ts
@lawh-mobile/app/(main)/quran-settings.tsx
@lawh-mobile/components/mushaf/MushafFrame.tsx
@lawh-mobile/components/mushaf/MushafPage.tsx
@lawh-mobile/components/mushaf/MushafScreen.tsx
@lawh-mobile/components/mushaf/MushafPageHeader.tsx
@lawh-mobile/components/mushaf/MushafBismillah.tsx

<interfaces>
<!-- Current settingsStore exports needed -->
From lawh-mobile/stores/settingsStore.ts:
```typescript
export type ReadingMode = 'mushaf' | 'arabic-cards' | 'translation-cards'
export type BannerTheme = 'bw' | 'classic' | 'blue' | 'pink'
export type PageDesign = 'fullscreen' | 'book'
export type LandscapeLayout = 'single' | 'double'
// Uses zustand persist with AsyncStorage
// partialize excludes _hasHydrated
```

From lawh-mobile/components/mushaf/MushafFrame.tsx:
```typescript
interface MushafFrameProps {
  children: ReactNode
  isSpecialPage?: boolean
}
// Currently hardcoded: backgroundColor: '#fff'
```

From lawh-mobile/components/mushaf/MushafPageHeader.tsx:
```typescript
interface MushafPageHeaderProps {
  surahNameSimple: string
  juz: number
}
// Currently hardcoded: color: '#666', separator: '#e0e0e0'
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add theme types/state to store and create useResolvedTheme hook</name>
  <files>lawh-mobile/stores/settingsStore.ts, lawh-mobile/hooks/useResolvedTheme.ts</files>
  <action>
1. In `settingsStore.ts`, add new types and state:
   ```typescript
   export type AppThemeMode = 'auto' | 'light' | 'dark'
   export type LightVariant = 'white' | 'beige'
   export type DarkVariant = 'black' | 'navy'
   ```
   Add to SettingsState interface:
   - `appThemeMode: AppThemeMode` (default: `'auto'`)
   - `lightVariant: LightVariant` (default: `'white'`)
   - `darkVariant: DarkVariant` (default: `'black'`)
   - `setAppThemeMode: (mode: AppThemeMode) => void`
   - `setLightVariant: (variant: LightVariant) => void`
   - `setDarkVariant: (variant: DarkVariant) => void`
   Add the three new fields to the `partialize` function so they persist.

2. Create `lawh-mobile/hooks/useResolvedTheme.ts`:
   ```typescript
   import { useColorScheme } from 'react-native'
   import { useSettingsStore } from '@/stores/settingsStore'

   export interface ResolvedTheme {
     isDark: boolean
     backgroundColor: string
     textColor: string
     secondaryTextColor: string
     separatorColor: string
   }

   export function useResolvedTheme(): ResolvedTheme {
     const systemScheme = useColorScheme()
     const appThemeMode = useSettingsStore((s) => s.appThemeMode)
     const lightVariant = useSettingsStore((s) => s.lightVariant)
     const darkVariant = useSettingsStore((s) => s.darkVariant)

     const isDark = appThemeMode === 'auto'
       ? systemScheme === 'dark'
       : appThemeMode === 'dark'

     const backgroundColor = isDark
       ? (darkVariant === 'black' ? '#000000' : '#0A1628')
       : (lightVariant === 'white' ? '#FFFFFF' : '#FAF6F0')

     const textColor = isDark ? '#FFFFFF' : '#000000'
     const secondaryTextColor = isDark ? '#999999' : '#666666'
     const separatorColor = isDark ? '#333333' : '#e0e0e0'

     return { isDark, backgroundColor, textColor, secondaryTextColor, separatorColor }
   }
   ```
  </action>
  <verify>
    <automated>cd /Users/yousef/Documents/Projects/Lawh/lawh-mobile && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>settingsStore has AppThemeMode/LightVariant/DarkVariant types exported with setters and persistence. useResolvedTheme hook exists and compiles, returning isDark/backgroundColor/textColor/secondaryTextColor/separatorColor.</done>
</task>

<task type="auto">
  <name>Task 2: Wire theme into mushaf components and add Appearance UI to quran-settings</name>
  <files>lawh-mobile/components/mushaf/MushafFrame.tsx, lawh-mobile/components/mushaf/MushafPage.tsx, lawh-mobile/components/mushaf/MushafScreen.tsx, lawh-mobile/components/mushaf/MushafPageHeader.tsx, lawh-mobile/components/mushaf/MushafBismillah.tsx, lawh-mobile/app/(main)/quran-settings.tsx</files>
  <action>
**A. Wire theme into mushaf components:**

1. **MushafFrame.tsx**: Add `backgroundColor` prop (optional string). Apply it via inline style overriding the hardcoded `'#fff'`. Keep `'#fff'` as fallback default.
   ```typescript
   interface MushafFrameProps {
     children: ReactNode
     isSpecialPage?: boolean
     backgroundColor?: string
   }
   ```
   In the View: `style={[styles.frame, backgroundColor ? { backgroundColor } : undefined]}`

2. **MushafPageHeader.tsx**: Add `textColor` and `separatorColor` optional props. Override hardcoded `'#666'` and `'#e0e0e0'` when provided.
   ```typescript
   interface MushafPageHeaderProps {
     surahNameSimple: string
     juz: number
     textColor?: string
     separatorColor?: string
   }
   ```
   Apply: `<Text style={[styles.text, textColor ? { color: textColor } : undefined]}>`
   Separator: `<View style={[styles.separator, separatorColor ? { backgroundColor: separatorColor } : undefined]} />`

3. **MushafBismillah.tsx**: Add optional `textColor` prop. The bismillah uses SurahNameV4Color font which is a color font -- for dark mode, the color font glyphs may not adapt. For now, just pass the prop and apply it to the text style (it will tint non-color-layer glyphs). If the color font renders its own colors, the style color may be overridden by the font, which is acceptable.
   ```typescript
   interface MushafBismillahProps {
     surahId: number
     textColor?: string
   }
   ```

4. **MushafPage.tsx**: Import and use `useResolvedTheme`. Pass theme colors down:
   - Pass `backgroundColor` to `<MushafFrame>`
   - Pass `textColor` and `separatorColor` to `<MushafPageHeader>`
   - Pass `textColor` to `<MushafBismillah>`
   - For ayah lines: apply `textColor` to the `v4Line` style via inline override: `{ color: theme.textColor }`
   - For page number at bottom: use `secondaryTextColor`
   - DO NOT call useResolvedTheme inside the memo component directly (it would break memoization). Instead, add `isDark` prop to MushafPageProps and have the PARENT (MushafScreen) pass it. Then compute colors inside MushafPage based on `isDark`:
     ```typescript
     // Inside MushafPageInner, compute colors from isDark + store values directly
     // to avoid breaking React.memo:
     const appThemeMode = useSettingsStore((s) => s.appThemeMode)
     const lightVariant = useSettingsStore((s) => s.lightVariant)
     const darkVariant = useSettingsStore((s) => s.darkVariant)
     const systemScheme = useColorScheme()
     const isDark = appThemeMode === 'auto' ? systemScheme === 'dark' : appThemeMode === 'dark'
     const bgColor = isDark ? (darkVariant === 'black' ? '#000000' : '#0A1628') : (lightVariant === 'white' ? '#FFFFFF' : '#FAF6F0')
     const txtColor = isDark ? '#FFFFFF' : '#000000'
     const secColor = isDark ? '#999999' : '#666666'
     const sepColor = isDark ? '#333333' : '#e0e0e0'
     ```
     Actually, since MushafPage already reads from useSettingsStore (tajweedEnabled), reading a few more selectors is fine and won't break memo (zustand selectors are stable). Use individual selectors for appThemeMode, lightVariant, darkVariant plus useColorScheme() to compute colors inline. This is simpler than prop drilling.

5. **MushafScreen.tsx**: Import `useResolvedTheme`. Replace the existing `useColorScheme()` + `isDark` logic with the hook. Use `theme.backgroundColor` for the root View and the loading View. Remove the old `colorScheme`/`isDark` variables.

**B. Add APPEARANCE section to quran-settings.tsx:**

1. Rename the existing "THEME" section title (line ~160) to "BANNER STYLE".

2. Add a new "APPEARANCE" section BEFORE "BANNER STYLE" (after LANDSCAPE LAYOUT). The section has:

   a. A main card with three rows: Auto, Light, Dark -- using the existing `SettingRow` pattern.
      - Auto icon: `"phone-portrait-outline"` (system)
      - Light icon: `"sunny-outline"`
      - Dark icon: `"moon-outline"`
      - Checkmark shows on the selected `appThemeMode`

   b. Conditionally show sub-option cards:
      - When `appThemeMode === 'light'` OR `appThemeMode === 'auto'`: show "LIGHT STYLE" sub-card with White / Beige rows
        - White icon: `"square-outline"`, Beige icon: `"albums-outline"`
        - Beige row label: "Parchment"
        - Checkmark on selected `lightVariant`
      - When `appThemeMode === 'dark'` OR `appThemeMode === 'auto'`: show "DARK STYLE" sub-card with True Black / Navy rows
        - True Black icon: `"contrast-outline"`, Navy icon: `"boat-outline"`
        - Checkmark on selected `darkVariant`

   c. Sub-cards use the same card/row styling but with a smaller section title (same `styles.sectionTitle` but maybe `marginTop: 12` instead of 20 for tighter grouping).

3. Add zustand selectors for the new state:
   ```typescript
   const appThemeMode = useSettingsStore((s) => s.appThemeMode)
   const setAppThemeMode = useSettingsStore((s) => s.setAppThemeMode)
   const lightVariant = useSettingsStore((s) => s.lightVariant)
   const setLightVariant = useSettingsStore((s) => s.setLightVariant)
   const darkVariant = useSettingsStore((s) => s.darkVariant)
   const setDarkVariant = useSettingsStore((s) => s.setDarkVariant)
   ```

4. Import `AppThemeMode, LightVariant, DarkVariant` types from store.
  </action>
  <verify>
    <automated>cd /Users/yousef/Documents/Projects/Lawh/lawh-mobile && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>
- Quran settings shows APPEARANCE section with Auto/Light/Dark rows and conditional Light Style (White/Parchment) and Dark Style (True Black/Navy) sub-cards
- Existing "THEME" section renamed to "BANNER STYLE"
- MushafFrame background adapts to resolved theme
- MushafPage text color adapts (black on light, white on dark)
- MushafPageHeader text and separator colors adapt
- MushafScreen root background uses resolved theme
- All hardcoded color values replaced with theme-driven values
  </done>
</task>

</tasks>

<verification>
- Open quran-settings: see APPEARANCE section with Auto/Light/Dark, sub-cards for light/dark variants
- Select Dark + True Black: mushaf background is #000000, text is white
- Select Dark + Navy: mushaf background is #0A1628, text is white
- Select Light + White: mushaf background is #FFFFFF, text is black
- Select Light + Parchment: mushaf background is #FAF6F0, text is black
- Select Auto: theme follows system setting, using chosen variants
- Kill and reopen app: theme preference persists
- TypeScript compiles with no errors
</verification>

<success_criteria>
- Theme mode (auto/light/dark) selectable in quran-settings with persisted preference
- Light and dark sub-variants selectable and persisted
- All mushaf components (frame, page, header, bismillah) render with theme-appropriate colors
- No hardcoded black/white colors remain in mushaf rendering path
- TypeScript strict mode passes
</success_criteria>

<output>
After completion, create `.planning/quick/9-add-app-theme-settings-with-auto-light-d/9-SUMMARY.md`
</output>

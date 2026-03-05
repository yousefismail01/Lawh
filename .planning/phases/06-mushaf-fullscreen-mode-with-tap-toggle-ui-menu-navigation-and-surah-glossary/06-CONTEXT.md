# Phase 6: Mushaf fullscreen mode with tap-toggle UI, menu navigation, and surah glossary - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the mushaf into a distraction-free, fullscreen reading experience with tap-to-toggle chrome, a hamburger menu for navigating to other app features via a new Home hub page, and a full-page surah/juz contents screen (glossary) for quick navigation. The existing tab bar is removed — the mushaf becomes the primary app screen.

</domain>

<decisions>
## Implementation Decisions

### Fullscreen toggle behavior
- Tap anywhere on the mushaf page toggles chrome (top icons + bottom PageNavigator) on/off
- When chrome is hidden, swiping pages does NOT trigger chrome — fully immersive
- MushafPageHeader (surah name, juz, hizb) stays visible at all times — it's part of the mushaf, not chrome
- Chrome auto-hides after ~5s of no interaction OR user taps again to dismiss manually
- App starts with chrome visible on launch (not immersive by default) — more discoverable for new users
- Status bar hides along with chrome for true immersive feel

### Menu icon and navigation
- Hamburger icon (☰ three lines) appears top-left when chrome is visible
- Tapping the menu icon navigates to a full Home hub page — a separate screen, not a drawer or modal
- The mushaf is the primary app experience — no tab bar visible on the mushaf screen
- Home hub page has links/cards for all app features: Hifz, Recite, Review, Profile, Settings
- Full hub page built in this phase (not a placeholder)
- Navigation: mushaf → (menu icon) → Home hub → (feature) or (back to mushaf)

### Surah glossary / Contents screen
- Full-page Contents screen (not a modal overlay) — accessed via glossary icon in the header
- Right arrow or back gesture to return to mushaf
- Toggle tabs at top: "Surahs" and "Quarters" views
- **Surahs tab:** Surahs grouped by juz (section headers: "PART 1", "PART 3", etc.)
  - Each surah row: number in circle, transliterated name, page number, verse count, Meccan/Medinan
  - Right-edge vertical juz index (1-30) for quick jumping
  - Tapping a juz number scrolls the surah list to that juz section (does not jump to mushaf)
  - Tapping a surah navigates to that surah's starting page in the mushaf
- **Quarters tab:** Shows hizb/quarter breakdown for juz-based navigation
- Bottom tabs on Contents screen: Contents (active), Khatmah (placeholder), Bookmarks (placeholder), Highlights (placeholder)
- Design reference: see attached image — cream/warm background, clean typography, Islamic-app aesthetic

### Chrome layout
- Menu icon (hamburger) and glossary icon both on the left side of the page header area
- Icons overlay on the existing MushafPageHeader — no extra bar added
- PageNavigator (bottom slider) is part of the unified chrome toggle — shows/hides with tap
- When chrome is off: only MushafPageHeader and mushaf content visible
- When chrome is on: MushafPageHeader + overlay icons (top-left) + PageNavigator (bottom)

### Claude's Discretion
- Animation style for chrome show/hide (fade, slide, or combination)
- Exact icon choices for glossary button (book, index, list icon)
- Home hub page layout and card design
- Quarters tab content layout and grouping
- How to handle the transition from current 5-tab layout to mushaf-primary architecture
- PageNavigator design adjustments to fit the new chrome toggle pattern

</decisions>

<specifics>
## Specific Ideas

- The glossary/contents screen should match the reference image aesthetic: cream/warm background, clean typography, surah numbers in circles, juz sections, right-edge juz index
- "PART N" section headers for juz grouping (matching the reference)
- The mushaf reading experience should feel completely immersive when chrome is hidden — like reading a real mushaf with nothing else on screen
- The Home hub replaces the tab bar as the central navigation point — mushaf is the "default state" of the app

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MushafScreen` (components/mushaf/MushafScreen.tsx): Main mushaf container with PagerView/FlatList, already has state for surahListVisible and selectedAyah
- `PageNavigator` (components/mushaf/PageNavigator.tsx): Bottom slider with auto-hide (3s timer), opacity animation, RTL slider — needs refactoring to use chrome toggle instead of its own timer
- `SurahListModal` (components/mushaf/SurahListModal.tsx): Full surah list with search, Arabic names, page jumping — logic reusable but UI replaced by the new Contents screen
- `MushafPageHeader` (components/mushaf/MushafPageHeader.tsx): Surah name, juz, hizb quarter icon — stays visible always, overlay icons added on top
- `quranService`: Has `getAllSurahs()`, `getSurahStartPage()` — needed for Contents screen
- `useSettingsStore`: Has `lastReadPage`, `navigationMode` — add chrome visibility state here

### Established Patterns
- `React.memo` on all mushaf components for performance
- `useCallback` for all handlers passed as props
- Color scheme support (isDark) with cream/parchment light theme
- PagerView for horizontal RTL navigation, FlatList for vertical mode
- Animated opacity for show/hide transitions (PageNavigator pattern)

### Integration Points
- `app/(tabs)/index.tsx`: Currently renders MushafScreen — tab layout needs to change to mushaf-primary (no tabs)
- `app/(tabs)/_layout.tsx`: Tab navigator needs restructuring — mushaf becomes root, hub becomes a separate route
- Expo Router navigation: Need new routes for Home hub and Contents screen
- `settingsStore`: Add `chromeVisible` state for the toggle

</code_context>

<deferred>
## Deferred Ideas

- Khatmah (completion tracking) tab — future phase, placeholder in this phase
- Bookmarks tab on Contents screen — future phase, placeholder in this phase
- Highlights tab on Contents screen — future phase, placeholder in this phase
- Search within the Contents screen (existing SurahListModal has search — can add later)

</deferred>

---

*Phase: 06-mushaf-fullscreen-mode-with-tap-toggle-ui-menu-navigation-and-surah-glossary*
*Context gathered: 2026-03-05*

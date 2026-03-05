# Phase 7: Expanded footer with reading layout selector, microphone placeholder, and ayah long-press action sheet with haptic feedback - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Expand the mushaf chrome footer into a two-row toolbar with a reading mode selector (mushaf vs card layouts + tajweed toggle), a microphone placeholder button, and enhance the ayah long-press action sheet with haptic feedback and functional audio playback. The footer remains part of the chrome toggle system from Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Footer toolbar layout
- Two-row footer: top row has icon buttons (layout selector, mic) flanking a centered page number; bottom row has the full-width page slider
- Footer is part of the chrome toggle — shows/hides with tap, auto-hides after 5s (consistent with Phase 6)
- Semi-transparent blur background (frosted glass effect, like iOS tab bars)
- Layout icon on the left side, mic button on the right side, page number centered between them
- Dark mode support follows existing cream/parchment ↔ dark theme patterns

### Reading mode selector
- Tapping the layout icon opens a popover/bottom sheet with mode options + tajweed toggle
- Three reading modes:
  1. **Mushaf** (default) — current 604-page Madinah Mushaf view with horizontal RTL swipe
  2. **Arabic Cards** — ayah-by-ayah card list with just Arabic text
  3. **Translation Cards** — ayah-by-ayah cards with Arabic + English translation (Sahih International) + transliteration
- Tajweed toggle switch in the popover: on/off (uses V4 font CPAL palettes — palette 0/1 for tajweed on, palette 3/4 for tajweed off)
- Switching between modes transforms the view in-place (no navigation to a separate screen)
- When switching to card mode, cards start from the current mushaf page position (maintains reading position)
- English translation only for now (Sahih International) — more languages deferred to future phase
- Translation data source: `/Users/yousef/Downloads/en-sahih-international-chunks.json`

### Microphone placeholder
- Mic button on the right side of the footer top row
- Accent color circle (gold/green) to visually distinguish it as the primary future action
- Tapping shows a brief "Recitation coming soon" toast/tooltip
- Button looks active/inviting (not grayed out) — builds anticipation for Phase 2

### Ayah long-press action sheet
- Add "Play Audio" button to existing actions (Bookmark, Translation, Tafsir)
- Play Audio is functional — streams ayah recitation audio (Mishary Rashid al-Afasy)
- Audio source: `/Users/yousef/Downloads/surah-recitation-mishari-rashid-al-afasy-streaming.db`
- Haptic feedback on two moments:
  1. Medium haptic on long-press (when action sheet opens — confirms gesture registered)
  2. Light haptic on each action button tap (subtle confirmation)

### Claude's Discretion
- Exact blur intensity and opacity for footer background
- Popover vs bottom sheet presentation for layout selector
- Icon choices for layout modes (book, cards, etc.)
- Accent color choice for mic button (gold vs green vs other)
- Toast/tooltip duration and animation for mic "coming soon"
- Audio playback UI within the action sheet (inline player, progress bar, etc.)
- How to parse and serve audio from the Alafasy streaming DB
- Card component design for Arabic-only and translation card modes
- Transliteration source and rendering approach

</decisions>

<specifics>
## Specific Ideas

- The footer should feel like a natural extension of the mushaf reading experience — frosted glass keeps it light and non-intrusive
- Mic button with accent circle signals "this is coming and it's going to be important" — teases the core AI feature
- Card modes should preserve reading position when switching — no losing your place
- Haptic feedback should feel iOS-native: medium impact for the long-press, light for button taps

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PageNavigator` (components/mushaf/PageNavigator.tsx): Current single-row slider — will be refactored into the bottom row of the new two-row footer
- `AyahActionSheet` (components/mushaf/AyahActionSheet.tsx): Existing Modal bottom sheet with Bookmark, Translation, Tafsir — add Play Audio and haptics
- `ChromeOverlay` (components/mushaf/ChromeOverlay.tsx): Top chrome bar with menu, info pill, icons — footer pairs with this
- `useChromeToggle` hook: Controls show/hide with 5s auto-hide timer — footer already integrated
- `MushafScreen` (components/mushaf/MushafScreen.tsx): Main container, already conditionally renders chrome components
- `useSettingsStore`: Has `navigationMode` (horizontal/vertical), `lastReadPage` — add reading mode and tajweed toggle state
- V4 Tajweed fonts with CPAL palettes: palette 0/1 (tajweed on light/dark), palette 3/4 (tajweed off light/dark)
- `tafsirService` and `translationService`: Existing services for fetching tafsir/translation data

### Established Patterns
- `React.memo` on all mushaf components
- `useCallback` for all handlers
- Reanimated `FadeIn`/`FadeOut` for chrome animations
- Color scheme support with `useColorScheme()` and isDark conditional styling
- cream/parchment light theme (#faf3e0), dark theme (#1c1812)

### Integration Points
- `MushafScreen`: Footer renders alongside ChromeOverlay, controlled by same `chromeVisible` state
- `settingsStore`: New state for `readingMode` ('mushaf' | 'arabic-cards' | 'translation-cards') and `tajweedEnabled` (boolean)
- Card view needs access to ayah data per page — `quranService` already has page-based queries
- Audio playback needs expo-av or similar for streaming from the Alafasy DB
- Haptics via `expo-haptics` (Haptics.impactAsync)

</code_context>

<deferred>
## Deferred Ideas

- Multiple translation languages — future phase (English only for now)
- Multiple reciter selection — future phase (Alafasy only for now)
- Continuous/auto-play audio across ayahs — future enhancement
- Dual-page landscape mode — future phase

</deferred>

---

*Phase: 07-expanded-footer-with-reading-layout-selector-microphone-placeholder-and-ayah-long-press-action-sheet-with-haptic-feedback*
*Context gathered: 2026-03-05*

# Phase 7: Expanded Footer with Reading Layout Selector, Microphone Placeholder, and Ayah Long-Press Action Sheet with Haptic Feedback - Research

**Researched:** 2026-03-05
**Domain:** React Native UI chrome (footer toolbar, popover/sheet, haptics, audio playback, card views)
**Confidence:** HIGH

## Summary

This phase expands the mushaf footer into a two-row chrome toolbar (top row: layout icon + page number + mic button; bottom row: page slider), adds a reading mode selector popover with three modes (mushaf, Arabic cards, translation cards) plus tajweed toggle, integrates haptic feedback on the ayah long-press action sheet, adds a functional "Play Audio" button using the Alafasy streaming DB, and places a placeholder mic button with a "coming soon" toast.

The existing codebase provides strong foundations: `PageNavigator` becomes the bottom row, `AyahActionSheet` gets two new features (haptics + Play Audio), `useChromeToggle` already manages show/hide with 5s auto-hide, and `settingsStore` needs two new persisted fields (`readingMode` and `tajweedEnabled`). Three new Expo packages are required: `expo-haptics`, `expo-audio`, and `expo-blur`.

**Primary recommendation:** Build the two-row footer as a new `MushafFooter` component wrapping the existing `PageNavigator` as its bottom row. Use `expo-blur` BlurView for frosted glass. Use `expo-audio` (the new API, not legacy `expo-av`) for ayah audio playback. Use `expo-haptics` for action sheet feedback.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Two-row footer: top row has icon buttons (layout selector, mic) flanking a centered page number; bottom row has the full-width page slider
- Footer is part of the chrome toggle -- shows/hides with tap, auto-hides after 5s (consistent with Phase 6)
- Semi-transparent blur background (frosted glass effect, like iOS tab bars)
- Layout icon on the left side, mic button on the right side, page number centered between them
- Dark mode support follows existing cream/parchment <-> dark theme patterns
- Tapping the layout icon opens a popover/bottom sheet with mode options + tajweed toggle
- Three reading modes: Mushaf (default), Arabic Cards, Translation Cards
- Tajweed toggle switch in the popover: on/off (uses V4 font CPAL palettes)
- Switching between modes transforms the view in-place (no navigation to a separate screen)
- When switching to card mode, cards start from the current mushaf page position
- English translation only (Sahih International) -- more languages deferred
- Translation data source: `/Users/yousef/Downloads/en-sahih-international-chunks.json`
- Mic button with accent color circle, tapping shows "Recitation coming soon" toast
- Button looks active/inviting (not grayed out)
- Add "Play Audio" button to existing action sheet actions
- Audio source: `/Users/yousef/Downloads/surah-recitation-mishari-rashid-al-afasy-streaming.db`
- Haptic feedback: medium on long-press (action sheet opens), light on each action button tap

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

### Deferred Ideas (OUT OF SCOPE)
- Multiple translation languages -- future phase (English only for now)
- Multiple reciter selection -- future phase (Alafasy only for now)
- Continuous/auto-play audio across ayahs -- future enhancement
- Dual-page landscape mode -- future phase
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-haptics | ~55.x | Haptic feedback on long-press and button taps | Official Expo haptics API; uses iOS Taptic Engine and Android haptics engine |
| expo-audio | ~55.x | Streaming MP3 playback for ayah recitation | Modern Expo audio API (replaces legacy expo-av); supports URL streaming |
| expo-blur | ~55.x | Frosted glass footer background | Official Expo BlurView; stable on Android in SDK 55 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-sqlite | ~55.0.10 | Read Alafasy streaming DB for audio URLs/segments | Already installed; query segments table for per-ayah timestamps |
| react-native-reanimated | ^4.2.1 | FadeIn/FadeOut animations for footer chrome | Already installed; consistent with ChromeOverlay patterns |
| zustand | ^5.0.11 | Persist readingMode and tajweedEnabled state | Already installed; extend settingsStore |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-audio | expo-av (legacy) | expo-av still works but is deprecated; expo-audio is the modern replacement with simpler hook-based API |
| expo-blur BlurView | Semi-transparent View with opacity | Simpler but no actual blur effect; user explicitly requested frosted glass |
| Bottom sheet library (@gorhom/bottom-sheet) | RN Modal or custom Animated view | Overkill for a simple popover with 4 options; a custom animated popover is lighter |

**Installation:**
```bash
npx expo install expo-haptics expo-audio expo-blur
```

## Architecture Patterns

### Recommended Component Structure
```
components/mushaf/
  MushafFooter.tsx          # NEW: Two-row footer (wraps PageNavigator)
  LayoutSelectorPopover.tsx # NEW: Reading mode + tajweed toggle popover
  MicPlaceholderButton.tsx  # NEW: Mic button with "coming soon" toast
  AyahActionSheet.tsx       # MODIFY: Add Play Audio + haptics
  AyahAudioPlayer.tsx       # NEW: Inline audio player for action sheet
  PageNavigator.tsx         # MODIFY: Remove container styling (becomes inner row)
  MushafScreen.tsx          # MODIFY: Swap PageNavigator for MushafFooter, add card views
  CardView.tsx              # NEW: Card-based reading mode container
  AyahCard.tsx              # NEW: Individual ayah card (Arabic-only or translation)

lib/data/
  translationData.ts        # NEW: Load and query en-sahih-international-chunks.json
  audioData.ts              # NEW: Load and query Alafasy streaming DB

stores/
  settingsStore.ts          # MODIFY: Add readingMode, tajweedEnabled
```

### Pattern 1: Two-Row Footer with BlurView
**What:** Composite footer component with blur background, two rows, chrome-controlled visibility
**When to use:** Footer toolbar that needs to feel native iOS with frosted glass
**Example:**
```typescript
// Source: expo-blur official docs + existing ChromeOverlay pattern
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export const MushafFooter = React.memo(function MushafFooter({
  currentPage, onPageChange, onLayoutPress, onMicPress
}: Props) {
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(300)}
      style={[styles.container, { paddingBottom: insets.bottom }]}
    >
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      {/* Top row: layout icon | page number | mic button */}
      <View style={styles.topRow}>
        <Pressable onPress={onLayoutPress}>
          {/* Layout icon */}
        </Pressable>
        <Text>{currentPage}</Text>
        <MicPlaceholderButton onPress={onMicPress} />
      </View>
      {/* Bottom row: page slider */}
      <PageNavigator currentPage={currentPage} onPageChange={onPageChange} />
    </Animated.View>
  );
});
```

### Pattern 2: Haptic Feedback on Action Sheet
**What:** Trigger haptics at two moments: medium on open, light on button tap
**When to use:** Confirming gesture registration and button taps in action sheets
**Example:**
```typescript
// Source: expo-haptics official docs
import * as Haptics from 'expo-haptics';

// On long-press detection (in MushafPage or MushafScreen):
const handleAyahLongPress = useCallback(async (info) => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  // ... open action sheet
}, []);

// On action button tap (inside AyahActionSheet):
const handleActionPress = useCallback(async (action: () => void) => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  action();
}, []);
```

### Pattern 3: Audio Playback from Streaming DB
**What:** Query the Alafasy SQLite DB for audio URL + per-ayah timestamps, stream the surah MP3 and seek to the ayah segment
**When to use:** Playing a single ayah's audio from the action sheet
**Example:**
```typescript
// Source: expo-audio docs + Alafasy DB schema analysis
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

// The Alafasy DB has:
// surah_list: surah_number, audio_url, duration
// segments: surah_number, ayah_number, timestamp_from, timestamp_to (in ms)

// To play surah 2, ayah 255:
// 1. Query segments WHERE surah_number=2 AND ayah_number=255
//    -> timestamp_from=123456, timestamp_to=134567
// 2. Query surah_list WHERE surah_number=2
//    -> audio_url = "https://download.quranicaudio.com/qdc/mishari_al_afasy/streaming/mp3/2.mp3"
// 3. Create player with URL, seek to timestamp_from/1000, play until timestamp_to

const player = useAudioPlayer(audioUrl);
// seekTo timestamp_from/1000 seconds, then play
// Set up listener to pause at timestamp_to/1000
```

### Pattern 4: Card View with Position Sync
**What:** FlatList of ayah cards that syncs with mushaf page position when switching modes
**When to use:** Arabic Cards and Translation Cards reading modes
**Example:**
```typescript
// When switching from mushaf to card mode:
// 1. Get all ayahs on the current mushaf page from local DB
// 2. Find the first ayah on that page (surahId:ayahNumber)
// 3. Render a FlatList of AyahCard components
// 4. initialScrollIndex = index of first ayah from current page

// Data flow: quranService.getAyahsBySurah() for Arabic text
//            translationData for English text (from JSON asset)
```

### Anti-Patterns to Avoid
- **Don't use expo-av for new audio:** It's the legacy API. Use `expo-audio` with `useAudioPlayer` hook.
- **Don't put blur logic inside PageNavigator:** Keep PageNavigator as a pure slider; the blur belongs to the parent MushafFooter.
- **Don't fetch translations from QUL API for card view:** The en-sahih-international-chunks.json has all 6,236 ayahs locally. Bundle it as a static asset for offline access.
- **Don't use BlurTargetView on iOS:** It's Android-only. Use platform checks or let expo-blur handle it internally.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Haptic feedback | Custom vibration patterns | `expo-haptics` impactAsync | Platform-native haptics engine integration; handles iOS Taptic Engine quirks |
| Frosted glass blur | Semi-transparent overlay with custom blur shader | `expo-blur` BlurView | Native blur on iOS, stable Android support in SDK 55; handles edge cases |
| Audio streaming | Custom fetch + ArrayBuffer decoding | `expo-audio` useAudioPlayer | Handles audio session management, interruptions, background state |
| SQLite queries | Raw SQL string building | drizzle-orm or expo-sqlite direct | Project already uses drizzle-orm for quran data; consistent patterns |

**Key insight:** All three new capabilities (haptics, audio, blur) have official Expo SDK packages that handle platform differences. Custom solutions would miss iOS Taptic Engine nuances, Android audio focus management, and blur rendering differences.

## Common Pitfalls

### Pitfall 1: BlurView Android Requires BlurTargetView in SDK 55
**What goes wrong:** BlurView renders as plain semi-transparent on Android without wrapping content in BlurTargetView
**Why it happens:** SDK 55 changed the Android blur implementation to use RenderNode API
**How to avoid:** On Android, wrap the blurred content area with `BlurTargetView` and pass its ref to `BlurView`. On iOS, BlurView works without it. Consider using Platform.OS check or just accept the semi-transparent fallback on Android.
**Warning signs:** Blur looks fine in iOS simulator but flat/transparent on Android

### Pitfall 2: Audio Seek Precision with Streaming MP3
**What goes wrong:** Seeking to a specific millisecond in a streaming MP3 may land slightly before/after the target
**Why it happens:** MP3 frame boundaries don't align perfectly with arbitrary timestamps
**How to avoid:** Add a small buffer (50-100ms) before the timestamp_from. When stopping at timestamp_to, use a polling interval or listener to pause near the end rather than expecting exact timing.
**Warning signs:** Ayah audio starts mid-word or cuts off early

### Pitfall 3: Chrome Toggle Conflicting with Popover
**What goes wrong:** Tapping the layout icon in the footer triggers the chrome toggle (hiding the footer) instead of opening the popover
**Why it happens:** The tap handler on MushafPage bubbles up through the chrome system
**How to avoid:** The footer buttons should call `event.stopPropagation()` or the chrome toggle tap should be on the MushafPage content area only (which it already is -- the `handlePageTap` is on the MushafPage `Pressable`, not a global touch handler). Ensure the footer's Pressable buttons don't propagate to the chrome toggle.
**Warning signs:** Popover opens briefly then footer disappears

### Pitfall 4: Reading Mode Switch Loses Page Position
**What goes wrong:** Switching from mushaf to cards doesn't maintain the user's reading position
**Why it happens:** Cards are ayah-indexed while mushaf is page-indexed; no mapping between them
**How to avoid:** When switching to card mode, query the `ayahs` table for all ayahs where `page = currentPage`, get the first ayah's surahId:ayahNumber, then find that ayah's index in the full card list and use it as `initialScrollIndex`.
**Warning signs:** User is on page 300 in mushaf, switches to cards, and sees Surah Al-Fatiha

### Pitfall 5: Translation JSON Footnotes Structure
**What goes wrong:** Rendering translation text includes `{"f": 1}` objects inline
**Why it happens:** The en-sahih-international-chunks.json uses a structured format where `t` is an array of strings and footnote markers (`{"f": N}`), and `f` is a map of footnote texts
**How to avoid:** Parse the `t` array: strings are display text, objects with `f` key are footnote markers. Either strip footnotes for card display or render them as superscript numbers.
**Warning signs:** Cards show `[object Object]` in translation text

### Pitfall 6: Auto-hide Timer Resets on Popover Interaction
**What goes wrong:** The 5s auto-hide timer hides the footer while the user is interacting with the layout selector popover
**Why it happens:** The chrome toggle timer doesn't know the popover is open
**How to avoid:** When popover is open, pause the auto-hide timer. Resume it when popover closes. The `useChromeToggle` hook doesn't have a pause method, so either add one or manage popover state to prevent hide while open.
**Warning signs:** Footer vanishes while user is selecting a reading mode

## Code Examples

### Alafasy Streaming DB Queries
```typescript
// The DB schema (verified from actual DB inspection):
// surah_list: surah_number INTEGER, audio_url TEXT, duration INTEGER
// segments: surah_number INTEGER, ayah_number INTEGER, duration_sec INTEGER,
//           timestamp_from INTEGER, timestamp_to INTEGER, segments TEXT

// Sample data from segments table:
// surah=1, ayah=2: timestamp_from=100, timestamp_to=5005 (milliseconds)
// surah=1, ayah=3: timestamp_from=5166, timestamp_to=8840

// Audio URLs follow pattern:
// https://download.quranicaudio.com/qdc/mishari_al_afasy/streaming/mp3/{surah}.mp3
```

### Translation Data Parsing
```typescript
// en-sahih-international-chunks.json structure (verified):
// Key: "surah:ayah" (e.g., "1:1", "2:255")
// Value: { t: (string | {f: number})[], f: Record<string, string> }
//
// t = text array: strings are display text, {f:N} are footnote markers
// f = footnotes map: key is footnote number, value is footnote text
//
// To get plain translation text:
function getTranslationText(entry: TranslationEntry): string {
  return entry.t
    .filter((part): part is string => typeof part === 'string')
    .join('');
}
// Total entries: 6,236 (complete Quran)
```

### Settings Store Extension
```typescript
// Add to settingsStore.ts:
type ReadingMode = 'mushaf' | 'arabic-cards' | 'translation-cards';

interface SettingsState {
  // ... existing fields
  readingMode: ReadingMode;
  tajweedEnabled: boolean;
  setReadingMode: (mode: ReadingMode) => void;
  setTajweedEnabled: (enabled: boolean) => void;
}
// Default: readingMode = 'mushaf', tajweedEnabled = true
// Add to partialize for persistence
```

### Expo-Audio Playback for Ayah
```typescript
// Source: expo-audio official docs
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

function AyahAudioPlayer({ audioUrl, startMs, endMs }: Props) {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);

  const handlePlay = useCallback(async () => {
    player.seekTo(startMs / 1000);
    player.play();
  }, [player, startMs]);

  // Monitor to stop at endMs
  useEffect(() => {
    if (status.playing && status.currentTime >= endMs / 1000) {
      player.pause();
    }
  }, [status.currentTime, status.playing, endMs, player]);

  return (/* progress bar + play/pause button */);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| expo-av Audio.Sound | expo-audio useAudioPlayer | SDK 52+ | Hook-based API, automatic cleanup, simpler status tracking |
| expo-blur Android fallback (transparent) | expo-blur with BlurTargetView on Android | SDK 55 | Real blur on Android now possible |
| Manual vibration API | expo-haptics with ImpactFeedbackStyle | Stable since SDK 48 | Platform-native haptics, no VIBRATE permission on Android with performAndroidHapticsAsync |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + @testing-library/react-native ^13.3.3 |
| Config file | jest-expo in package.json |
| Quick run command | `npx jest --testPathPattern=mushaf --bail` |
| Full suite command | `npx jest` |

### Phase Requirements -> Test Map

This phase has no formal requirement IDs mapped in REQUIREMENTS.md (Phase 7 is a UI polish/feature phase added post-requirements). Key behaviors to validate:

| Behavior | Test Type | Automated Command |
|----------|-----------|-------------------|
| MushafFooter renders two rows with blur | unit | `npx jest MushafFooter --bail` |
| LayoutSelectorPopover shows 3 modes + tajweed toggle | unit | `npx jest LayoutSelectorPopover --bail` |
| settingsStore persists readingMode and tajweedEnabled | unit | `npx jest settingsStore --bail` |
| Translation data parser handles footnote objects | unit | `npx jest translationData --bail` |
| AyahActionSheet triggers haptics on open/tap | unit (mocked) | `npx jest AyahActionSheet --bail` |

### Sampling Rate
- **Per task commit:** `npx jest --bail --testPathPattern=mushaf`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/components/mushaf/MushafFooter.test.tsx` -- footer rendering
- [ ] `__tests__/lib/data/translationData.test.ts` -- JSON parsing with footnotes
- [ ] `__tests__/stores/settingsStore.test.ts` -- new readingMode/tajweedEnabled fields

## Open Questions

1. **Transliteration data source**
   - What we know: Translation Cards should show Arabic + English + transliteration per the context decisions. No transliteration file was found in Downloads.
   - What's unclear: Where to source transliteration data. The QUL API may provide it, or a separate dataset is needed.
   - Recommendation: Use the `name_transliteration` field already in the surahs table as a pattern reference. For ayah-level transliteration, fetch from QUL API (`text_uthmani` field may have transliteration endpoint) or defer transliteration to a follow-up if no source is readily available. Start with Arabic + English only for MVP.

2. **BlurTargetView on Android**
   - What we know: SDK 55 requires BlurTargetView wrapper on Android for real blur
   - What's unclear: Whether this applies to a footer that overlays the mushaf (the content being blurred is behind the footer, not wrapped by it)
   - Recommendation: Start with basic BlurView. If Android shows no blur, fall back to semi-transparent background (existing PageNavigator pattern uses `rgba()` opacity which looks fine). The frosted glass is a nice-to-have visual polish, not a blocker.

3. **Audio player lifecycle in action sheet**
   - What we know: useAudioPlayer creates a player tied to component lifecycle
   - What's unclear: Whether the player should persist when action sheet closes (to allow background continuation) or stop immediately
   - Recommendation: Stop audio when action sheet closes (user locked decision says no continuous/auto-play). Unmount the AyahAudioPlayer component on sheet close.

## Sources

### Primary (HIGH confidence)
- [Expo Haptics docs](https://docs.expo.dev/versions/latest/sdk/haptics/) -- API methods, enums, platform notes
- [Expo Audio docs](https://docs.expo.dev/versions/latest/sdk/audio/) -- useAudioPlayer hook, playback API
- [Expo BlurView docs](https://docs.expo.dev/versions/latest/sdk/blur-view/) -- BlurView props, SDK 55 Android changes
- Alafasy streaming DB (local inspection) -- schema verified: surah_list + segments tables with audio URLs and ms timestamps
- en-sahih-international-chunks.json (local inspection) -- 6,236 entries, structured text+footnotes format verified

### Secondary (MEDIUM confidence)
- [Expo SDK 55 changelog](https://expo.dev/changelog/sdk-55) -- BlurView stability on Android confirmed

### Tertiary (LOW confidence)
- Transliteration data availability -- no source identified; may need API fetch or separate dataset

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all three packages are official Expo SDK modules, verified via docs
- Architecture: HIGH -- patterns follow existing codebase conventions (React.memo, useCallback, Reanimated, zustand)
- Pitfalls: HIGH -- verified through code inspection (chrome toggle, DB schema, JSON structure)
- Audio playback: MEDIUM -- expo-audio is newer API, seek-to-timestamp pattern not battle-tested in this codebase
- Transliteration: LOW -- no data source identified

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable Expo SDK, unlikely to change)

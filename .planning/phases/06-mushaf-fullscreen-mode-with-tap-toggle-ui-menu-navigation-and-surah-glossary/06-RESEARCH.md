# Phase 6: Mushaf Fullscreen Mode with Tap-Toggle UI, Menu Navigation, and Surah Glossary - Research

**Researched:** 2026-03-05
**Domain:** React Native navigation architecture, fullscreen UX, animated chrome toggle
**Confidence:** HIGH

## Summary

This phase transforms the app from a 5-tab layout to a mushaf-primary architecture with tap-to-toggle chrome, a Home hub page, and a full-page Contents screen (surah glossary). The existing codebase already uses Expo Router with route groups, react-native-reanimated, and Animated API patterns that directly support this work.

The key technical challenges are: (1) restructuring Expo Router layout from `(tabs)` to a Stack-based mushaf-primary architecture, (2) implementing a unified chrome visibility toggle with auto-hide timer and status bar sync, (3) building a SectionList-based Contents screen with juz-grouped surahs and a vertical juz index, and (4) creating a Home hub page that replaces the tab bar as the central navigation point.

**Primary recommendation:** Replace the `(tabs)` layout group with a root Stack navigator where the mushaf is the initial route, and add `hub`, `contents`, and placeholder feature screens as stack routes. Use `react-native-reanimated` for chrome fade animations and `expo-status-bar` for status bar hiding.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Tap anywhere on mushaf page toggles chrome (top icons + bottom PageNavigator) on/off
- When chrome is hidden, swiping pages does NOT trigger chrome -- fully immersive
- MushafPageHeader (surah name, juz, hizb) stays visible at all times -- not chrome
- Chrome auto-hides after ~5s of no interaction OR user taps again to dismiss manually
- App starts with chrome visible on launch (not immersive by default)
- Status bar hides along with chrome for true immersive feel
- Hamburger icon top-left when chrome visible, navigates to full Home hub page (separate screen, not drawer)
- Mushaf is primary app experience -- no tab bar on mushaf screen
- Home hub page has links/cards for all app features: Hifz, Recite, Review, Profile, Settings
- Full hub page built in this phase (not placeholder)
- Full-page Contents screen (not modal) accessed via glossary icon in header
- Toggle tabs at top: "Surahs" and "Quarters" views
- Surahs grouped by juz with "PART N" section headers
- Each surah row: number in circle, transliterated name, page number, verse count, Meccan/Medinan
- Right-edge vertical juz index (1-30) for quick jumping
- Tapping juz number scrolls surah list to that juz section
- Tapping surah navigates to that surah's starting page in mushaf
- Quarters tab shows hizb/quarter breakdown
- Bottom tabs on Contents screen: Contents (active), Khatmah (placeholder), Bookmarks (placeholder), Highlights (placeholder)
- Menu icon and glossary icon both on left side, overlay on MushafPageHeader
- PageNavigator is part of unified chrome toggle

### Claude's Discretion
- Animation style for chrome show/hide (fade, slide, or combination)
- Exact icon choices for glossary button (book, index, list icon)
- Home hub page layout and card design
- Quarters tab content layout and grouping
- How to handle transition from current 5-tab layout to mushaf-primary architecture
- PageNavigator design adjustments for new chrome toggle pattern

### Deferred Ideas (OUT OF SCOPE)
- Khatmah (completion tracking) tab -- future phase, placeholder only
- Bookmarks tab on Contents screen -- future phase, placeholder only
- Highlights tab on Contents screen -- future phase, placeholder only
- Search within Contents screen
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-router | ~55.0.3 | File-based navigation | Already in project; route groups for layout restructuring |
| react-native-reanimated | ^4.2.1 | Chrome fade animations | Already in project; FadeIn/FadeOut entering/exiting animations |
| expo-status-bar | ~55.0.4 | Status bar show/hide | Already in project; `hidden` prop for immersive mode |
| react-native-safe-area-context | ~5.6.2 | Safe area insets | Already in project; needed for chrome overlay positioning |
| zustand | ^5.0.11 | Chrome visibility state | Already in project; settingsStore pattern |
| react-native-screens | ~4.23.0 | Native screen transitions | Already in project; Stack navigation performance |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native (SectionList) | 0.83.2 | Juz-grouped surah list | Contents screen Surahs tab |
| react-native (Animated) | 0.83.2 | Simple opacity transitions | PageNavigator already uses this pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SectionList | FlatList with manual headers | SectionList has built-in section headers and `scrollToLocation` -- no reason to hand-roll |
| react-native-reanimated FadeIn/FadeOut | RN Animated opacity | Reanimated is already installed and offers better performance with native driver; use for chrome toggle |
| Expo Router Stack | Custom navigation | Expo Router is already the project navigator; Stack is the natural fit for mushaf-primary |

**Installation:**
```bash
# No new packages needed -- everything is already installed
```

## Architecture Patterns

### Recommended Route Structure Change

**Current:**
```
app/
  _layout.tsx          # Root Stack: (tabs), auth, surah/[id]
  (tabs)/
    _layout.tsx        # Tabs: index(Mushaf), hifz, recite, review, profile
    index.tsx          # MushafScreen
    hifz.tsx           # placeholder
    recite.tsx         # placeholder
    review.tsx         # placeholder
    profile.tsx        # placeholder
  auth/
    _layout.tsx
    sign-in.tsx
  surah/[id].tsx
```

**New:**
```
app/
  _layout.tsx          # Root Stack: (main), auth
  (main)/
    _layout.tsx        # Stack with headerShown: false
    index.tsx          # MushafScreen (primary screen, no tabs)
    hub.tsx            # Home hub page (navigated via hamburger menu)
    contents.tsx       # Surah glossary / Contents screen
    hifz.tsx           # placeholder (navigated from hub)
    recite.tsx         # placeholder
    review.tsx         # placeholder
    profile.tsx        # placeholder
    settings.tsx       # placeholder
  auth/
    _layout.tsx
    sign-in.tsx
  surah/[id].tsx
```

**Key changes:**
- `(tabs)` group with `Tabs` layout replaced by `(main)` group with `Stack` layout
- Mushaf remains `index.tsx` (initial route)
- Hub, Contents, and feature screens are Stack routes pushed on top
- No tab bar visible anywhere on the mushaf screen
- AuthGate redirect changes from `/(tabs)/` to `/(main)/`

### Pattern 1: Chrome Visibility Toggle
**What:** Centralized chrome state with auto-hide timer
**When to use:** MushafScreen manages chrome show/hide for overlay icons and PageNavigator

```typescript
// In settingsStore or a dedicated useChromeToggle hook
interface ChromeState {
  chromeVisible: boolean
  setChromeVisible: (visible: boolean) => void
  toggleChrome: () => void
}

// Custom hook approach (recommended over store for ephemeral UI state)
function useChromeToggle(autoHideMs = 5000) {
  const [visible, setVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), autoHideMs)
  }, [autoHideMs])

  const toggle = useCallback(() => {
    setVisible(prev => {
      const next = !prev
      if (next) resetTimer()
      return next
    })
  }, [resetTimer])

  // Start auto-hide on mount
  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [resetTimer])

  return { visible, toggle, resetTimer }
}
```

### Pattern 2: Status Bar Sync with Chrome
**What:** Status bar hides/shows in sync with chrome toggle
**When to use:** When chrome visibility changes

```typescript
import { StatusBar } from 'expo-status-bar'

// In MushafScreen render:
<StatusBar hidden={!chromeVisible} animated />
```

### Pattern 3: Chrome Overlay with Reanimated
**What:** Fade in/out overlay icons and PageNavigator using Reanimated entering/exiting
**When to use:** Chrome elements that conditionally render

```typescript
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

// Conditionally render chrome overlay
{chromeVisible && (
  <Animated.View
    entering={FadeIn.duration(200)}
    exiting={FadeOut.duration(300)}
    style={styles.chromeOverlay}
  >
    <ChromeIcons />
  </Animated.View>
)}
```

### Pattern 4: SectionList with Juz Groups
**What:** Surahs grouped by juz using SectionList
**When to use:** Contents screen Surahs tab

```typescript
// Build sections from surah data
const sections = useMemo(() => {
  const juzGroups: Record<number, Surah[]> = {}
  for (const surah of surahs) {
    const juz = getJuzForPage(surah.pageStart)
    if (!juzGroups[juz]) juzGroups[juz] = []
    juzGroups[juz].push(surah)
  }
  return Object.entries(juzGroups).map(([juz, data]) => ({
    title: `PART ${juz}`,
    juz: Number(juz),
    data,
  }))
}, [surahs])

<SectionList
  ref={sectionListRef}
  sections={sections}
  renderSectionHeader={({ section }) => <JuzHeader title={section.title} />}
  renderItem={({ item }) => <SurahRow surah={item} />}
  stickySectionHeadersEnabled={false}
/>
```

### Pattern 5: Vertical Juz Index (Right Edge)
**What:** Vertical column of 1-30 numbers for quick-scroll
**When to use:** Right edge of Contents screen Surahs tab

```typescript
// Absolute positioned vertical index
<View style={styles.juzIndex}>
  {Array.from({ length: 30 }, (_, i) => i + 1).map(juz => (
    <Pressable
      key={juz}
      onPress={() => scrollToJuz(juz)}
      style={styles.juzIndexItem}
    >
      <Text style={styles.juzIndexText}>{juz}</Text>
    </Pressable>
  ))}
</View>

// scrollToJuz uses SectionList.scrollToLocation
const scrollToJuz = (juz: number) => {
  const sectionIndex = sections.findIndex(s => s.juz === juz)
  if (sectionIndex >= 0) {
    sectionListRef.current?.scrollToLocation({
      sectionIndex,
      itemIndex: 0,
      animated: true,
    })
  }
}
```

### Anti-Patterns to Avoid
- **Using a Drawer navigator for the menu:** The user explicitly wants a full Hub page, not a drawer. Use Stack push navigation.
- **Keeping tab bar and hiding it:** Don't use `tabBarStyle: { display: 'none' }` hacks. Restructure to Stack layout instead.
- **Storing chrome visibility in AsyncStorage:** Chrome visibility is ephemeral UI state, not persisted settings. Use a hook or non-persisted state.
- **Intercepting swipe gestures on PagerView:** The decision says swiping should NOT trigger chrome. Since chrome toggle is on tap, and PagerView handles swipes, they are naturally separate -- do not add gesture interceptors.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Section list with sticky headers | Custom scroll tracking + manual header injection | `SectionList` with `renderSectionHeader` | Built-in section support, `scrollToLocation` API |
| Fade animations | Manual `Animated.Value` opacity management | Reanimated `FadeIn`/`FadeOut` entering/exiting | Less boilerplate, native-driven, handles mount/unmount |
| Status bar hiding | `StatusBar.setHidden()` imperative calls | `<StatusBar hidden={bool} />` declarative component | Declarative syncs with React state; imperative risks getting out of sync |
| Safe area handling | Manual platform-specific padding | `useSafeAreaInsets()` | Already used in project; handles notch, dynamic island, home indicator |
| Surah-to-juz mapping | Manual page range calculation | Existing `pageJuzHizb.ts` `getPageJuzHizb()` function | Already computed with correct juz/hizb/quarter boundaries |

## Common Pitfalls

### Pitfall 1: Chrome Tap vs PagerView Swipe Conflict
**What goes wrong:** Tap handler on mushaf area interferes with PagerView horizontal swipe gestures
**Why it happens:** Pressable/TouchableOpacity wrapping the entire page can eat gesture events
**How to avoid:** Use `Pressable` with `onPress` on the MushafPage content area, NOT wrapping PagerView. PagerView's native gesture handling takes priority over JS press handlers naturally. Only handle taps on the page content, not the pager container.
**Warning signs:** Swipe navigation stops working or becomes jerky

### Pitfall 2: Auto-Hide Timer Not Reset on Navigation
**What goes wrong:** User navigates to Contents or Hub, returns to mushaf, and chrome immediately hides
**Why it happens:** Timer started before navigation continues running in background
**How to avoid:** Clear timer on unmount (cleanup in useEffect). Reset timer when screen gains focus using `useFocusEffect` from expo-router.
**Warning signs:** Chrome disappears immediately after returning to mushaf

### Pitfall 3: StatusBar Animation Lag
**What goes wrong:** Status bar show/hide visually lags behind chrome animation
**Why it happens:** Status bar animation is system-controlled and may not match custom animation duration
**How to avoid:** Set `animated` prop on StatusBar component. Accept slight timing difference -- it is native behavior.
**Warning signs:** Status bar snaps while chrome fades smoothly

### Pitfall 4: SectionList scrollToLocation Inaccuracy
**What goes wrong:** Tapping a juz number in the vertical index scrolls to wrong position
**Why it happens:** `scrollToLocation` requires accurate item heights for calculation. Variable-height rows cause offset errors.
**How to avoid:** Use `getItemLayout` on SectionList if rows are fixed height. If variable, use `viewOffset` parameter to adjust. Test with actual data.
**Warning signs:** Scroll position is off by a few rows

### Pitfall 5: AuthGate Redirect Path Change
**What goes wrong:** After login, user sees blank screen or crashes
**Why it happens:** AuthGate in `_layout.tsx` redirects to `/(tabs)/` which no longer exists after restructuring
**How to avoid:** Update AuthGate redirect from `/(tabs)/` to `/(main)/` simultaneously with layout restructuring. Test login flow after change.
**Warning signs:** White screen after sign-in

### Pitfall 6: PageNavigator Own Timer vs Chrome Timer
**What goes wrong:** PageNavigator has its own 3s auto-hide timer that conflicts with the new 5s chrome toggle
**Why it happens:** PageNavigator currently manages its own visibility state independently
**How to avoid:** Remove PageNavigator's internal visibility management. Make it a controlled component that receives `visible` prop from the parent chrome state. Remove its own timer, opacity animation, and tap-to-show logic.
**Warning signs:** PageNavigator and overlay icons hide/show at different times

## Code Examples

### MushafScreen Chrome Integration
```typescript
// MushafScreen.tsx - updated render structure
export function MushafScreen() {
  const { visible: chromeVisible, toggle: toggleChrome, resetTimer } = useChromeToggle(5000)

  const handlePageTap = useCallback(() => {
    toggleChrome()
  }, [toggleChrome])

  return (
    <View style={styles.root}>
      <StatusBar hidden={!chromeVisible} animated />

      {/* MushafPageHeader -- always visible, not part of chrome */}
      {/* Chrome overlay icons rendered ON TOP of header when chrome visible */}
      {chromeVisible && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(300)}
          style={styles.chromeTopOverlay}
        >
          <Pressable onPress={() => router.push('/hub')} hitSlop={12}>
            {/* Hamburger icon */}
          </Pressable>
          <Pressable onPress={() => router.push('/contents')} hitSlop={12}>
            {/* Glossary icon */}
          </Pressable>
        </Animated.View>
      )}

      {/* PagerView / FlatList for mushaf pages */}
      {/* Each MushafPage receives onPress={handlePageTap} */}

      {/* PageNavigator -- controlled visibility from chrome state */}
      {chromeVisible && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(300)}
        >
          <PageNavigator
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </Animated.View>
      )}
    </View>
  )
}
```

### Route Layout Restructuring
```typescript
// app/(main)/_layout.tsx
import { Stack } from 'expo-router'

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="hub" />
      <Stack.Screen name="contents" />
      <Stack.Screen name="hifz" />
      <Stack.Screen name="recite" />
      <Stack.Screen name="review" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
    </Stack>
  )
}
```

### Home Hub Page
```typescript
// app/(main)/hub.tsx
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const FEATURES = [
  { key: 'hifz', title: 'Hifz', subtitle: 'Track memorization', route: '/hifz' },
  { key: 'recite', title: 'Recite', subtitle: 'Practice recitation', route: '/recite' },
  { key: 'review', title: 'Review', subtitle: 'Spaced repetition', route: '/review' },
  { key: 'profile', title: 'Profile', subtitle: 'Your progress', route: '/profile' },
  { key: 'settings', title: 'Settings', subtitle: 'App preferences', route: '/settings' },
]

export default function HubScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable onPress={() => router.back()} style={styles.backToMushaf}>
        <Text>Back to Mushaf</Text>
      </Pressable>
      {FEATURES.map(f => (
        <Pressable key={f.key} onPress={() => router.push(f.route)} style={styles.card}>
          <Text style={styles.cardTitle}>{f.title}</Text>
          <Text style={styles.cardSubtitle}>{f.subtitle}</Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}
```

### Contents Screen - Surahs Tab with Juz Groups
```typescript
// Build juz-grouped sections for SectionList
function buildJuzSections(surahs: Surah[]): Section[] {
  // Use the first ayah's juz to determine which juz a surah starts in
  // We can derive this from surah.pageStart using getPageJuzHizb
  const juzMap = new Map<number, Surah[]>()

  for (const surah of surahs) {
    const { juz } = getPageJuzHizb(surah.pageStart)
    if (!juzMap.has(juz)) juzMap.set(juz, [])
    juzMap.get(juz)!.push(surah)
  }

  return Array.from(juzMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([juz, data]) => ({
      title: `PART ${juz}`,
      juz,
      data,
    }))
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tab-based Quran apps | Mushaf-primary with hub navigation | 2024+ | Better reading immersion, fewer distractions |
| Modal overlays for navigation | Full-page Contents screens | Current | Better UX for complex navigation like surah glossary |
| `Animated` API for simple transitions | Reanimated entering/exiting | Reanimated v3+ | Less boilerplate, native driver by default |
| Imperative StatusBar.setHidden() | Declarative `<StatusBar hidden />` | expo-status-bar current | Syncs with React state naturally |

## Open Questions

1. **Tap target on MushafPage for chrome toggle**
   - What we know: PagerView handles swipe gestures natively; Pressable onPress should not conflict
   - What's unclear: Whether the tap should be on each individual MushafPage component or on a transparent overlay above PagerView
   - Recommendation: Add `onPress` to MushafPage's root Pressable wrapper. Test that PagerView swipes still work. If conflict, use a transparent overlay with gesture handler that only responds to taps (not pans).

2. **Contents screen bottom tabs implementation**
   - What we know: 4 tabs at bottom (Contents, Khatmah, Bookmarks, Highlights) with 3 being placeholders
   - What's unclear: Whether to use a nested Tab navigator or simple custom tab bar with state
   - Recommendation: Use a simple custom tab bar with local state (useState for activeTab). No need for a nested navigator when 3/4 tabs are just placeholder text. Simpler, less routing complexity.

3. **Quarters tab data source**
   - What we know: `pageJuzHizb.ts` has JUZ_START_PAGES, HIZB_START_PAGES, RUB_START_PAGES (240 entries)
   - What's unclear: Exact visual layout for quarters view
   - Recommendation: Group by juz (30 sections), each showing 2 hizbs with 4 quarters each. Each quarter row shows start page. Tapping navigates to that page in mushaf.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | jest-expo 55.0.9 + @testing-library/react-native 13.3.3 |
| Config file | lawh-mobile/jest.config.js |
| Quick run command | `cd lawh-mobile && npx jest --testPathPattern='__tests__' --bail` |
| Full suite command | `cd lawh-mobile && npx jest` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| P6-01 | Chrome toggle shows/hides on tap | unit | `npx jest __tests__/hooks/useChromeToggle.test.ts -x` | No - Wave 0 |
| P6-02 | Auto-hide timer fires after 5s | unit | `npx jest __tests__/hooks/useChromeToggle.test.ts -x` | No - Wave 0 |
| P6-03 | Juz sections built correctly from surah data | unit | `npx jest __tests__/components/contentsScreen.test.ts -x` | No - Wave 0 |
| P6-04 | Route structure renders mushaf as index | unit | `npx jest __tests__/navigation/mainLayout.test.ts -x` | No - Wave 0 |
| P6-05 | Hub page renders all feature cards | unit | `npx jest __tests__/screens/hub.test.ts -x` | No - Wave 0 |
| P6-06 | PageNavigator controlled mode (no internal timer) | unit | `npx jest __tests__/components/pageNavigator.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `cd lawh-mobile && npx jest --bail`
- **Per wave merge:** `cd lawh-mobile && npx jest`
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
- [ ] `__tests__/hooks/useChromeToggle.test.ts` -- covers P6-01, P6-02
- [ ] `__tests__/components/contentsScreen.test.ts` -- covers P6-03
- [ ] `__tests__/navigation/mainLayout.test.ts` -- covers P6-04
- [ ] `__tests__/screens/hub.test.ts` -- covers P6-05

## Sources

### Primary (HIGH confidence)
- Existing codebase: MushafScreen.tsx, PageNavigator.tsx, SurahListModal.tsx, settingsStore.ts, app/_layout.tsx, app/(tabs)/_layout.tsx
- Existing data: pageJuzHizb.ts (juz/hizb/quarter page mappings), quranService.ts (surah queries), types/quran.ts (Surah interface)
- [Expo Router layout docs](https://docs.expo.dev/router/basics/layout/) - Route groups and Stack/Tabs/Slot layouts
- [Expo Router notation docs](https://docs.expo.dev/router/basics/notation/) - Parentheses groups
- [Expo StatusBar docs](https://docs.expo.dev/versions/latest/sdk/status-bar/) - Declarative hidden prop
- [Reanimated entering/exiting animations](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/entering-exiting-animations/) - FadeIn/FadeOut API

### Secondary (MEDIUM confidence)
- [Expo Router nesting navigators](https://docs.expo.dev/router/advanced/nesting-navigators/) - Stack inside groups pattern

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, no new dependencies
- Architecture: HIGH - Expo Router route groups and Stack layout are well-documented; codebase structure is clear
- Pitfalls: HIGH - Based on direct code analysis of existing PageNavigator timer, AuthGate redirect, and gesture handling
- Code examples: MEDIUM - Patterns are standard but exact integration with existing MushafPage tap handling needs runtime verification

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable libraries, no fast-moving dependencies)

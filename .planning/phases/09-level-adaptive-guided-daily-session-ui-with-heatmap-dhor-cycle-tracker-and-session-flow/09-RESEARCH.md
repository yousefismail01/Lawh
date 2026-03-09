# Phase 9: Level-Adaptive Guided Daily Session UI - Research

**Researched:** 2026-03-09
**Domain:** React Native UI, Zustand state management, Madinah-method hifz algorithm integration
**Confidence:** HIGH

## Summary

Phase 9 transforms the existing Hifz tab from a static information display into a guided daily session experience. The pure TypeScript Madinah-method algorithm (lib/algorithm/) already provides all the computation: level determination, session generation, dhor cycle scheduling, sabaq throttling, and recovery plans. The TodaySession card already shows sabaq/sabqi/dhor breakdown. What's missing is: (1) the ability to actually execute a session tier-by-tier with quality ratings, (2) visual feedback on memorization health (heatmap), (3) dhor cycle progress tracking, (4) level-adaptive visual weighting, (5) sabaq pause state UI, (6) missed day recovery flow, and (7) level transition awareness.

The key architectural challenge is bridging the page-based Madinah algorithm (which thinks in juz/pages) with the existing ayah-based review system (hifzStore/hifzService which thinks in surah/ayah ranges). The session flow needs a new "guided session" screen that walks through sabaq -> sabqi -> dhor sequentially, using a simplified 1-5 quality rating (not the SM-2+ 4-button grade bar) for dhor/sabqi, then writes quality scores back to madinahHifzStore.

**Primary recommendation:** Build the guided session flow as a new screen (app/(main)/session.tsx) that reads from madinahHifzStore.todaySession and walks through each tier sequentially. Add heatmap and dhor cycle tracker as new components in the Hifz tab. Extend madinahHifzStore with session completion tracking, quality score history, and last-session-date for missed day detection.

<phase_requirements>
## Phase Requirements

Since no formal requirement IDs exist for Phase 9, the following are derived from VISION.md and the phase name. These map to existing dashboard/session requirements where applicable.

| ID | Description | Research Support |
|----|-------------|-----------------|
| P9-01 | Guided daily session flow (sabaq -> sabqi -> dhor linear walkthrough) | madinahHifzStore.todaySession already generates the session; needs new session.tsx screen |
| P9-02 | Level-adaptive visual weight (session card sizes change by student level) | getLevelConfig().sessionSplit provides exact percentages per level |
| P9-03 | 604-page mushaf heatmap colored by confidence + recency | Needs new data: per-page quality mapping from juzQualityScores + lastReviewed |
| P9-04 | Dhor cycle tracker (circular/linear progress through current cycle) | DhorCycle type already has entries[] and cycleLengthDays; needs dhorDayNumber tracking |
| P9-05 | Sabaq pause state UI with encouraging messaging | getSabaqAllowance() returns reason strings; needs UI card when allowed=false |
| P9-06 | Session quality rating (1-5 scale for dhor/sabqi tiers) | New: simpler than SM-2+ grade bar, writes to juzQualityScores |
| P9-07 | Missed day recovery flow | generateRecoveryPlan() exists; needs UI to detect missed days and show recovery |
| P9-08 | Level transition interstitial | getStudentLevel() detects level; need to track previousLevel in store |
| P9-09 | Post-session summary with tier-specific results | Extend SessionSummary or create MadinahSessionSummary component |
| DASH-06 | Activity heatmap showing 12 weeks of session intensity | Related to P9-03 but session-focused; needs session history log |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native | 0.79+ | UI framework | Already in project |
| zustand | 5.x | State management | Already used for all stores (madinahHifzStore, hifzStore, settingsStore) |
| @react-native-async-storage/async-storage | 2.x | Persist madinahHifzStore | Already used |
| expo-haptics | ~14.x | Tactile feedback on session actions | Already used throughout |
| react-native-svg | 15.x | Heatmap grid rendering, dhor cycle arc | Already installed |
| @expo/vector-icons (Ionicons) | Already installed | Icons | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-blur | ~14.x | Blur overlay for session reveal states | Already used in review.tsx |
| react-native-reanimated | 3.x | Smooth transitions for level-adaptive layout changes | Already installed via Expo |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom SVG heatmap | react-native-heatmap-chart | No mature RN heatmap library exists; custom SVG is the standard approach |
| Custom circular progress | react-native-circular-progress | Already have SVG; adding another dep for one component is not worth it |
| react-native-calendars | Custom grid | Heatmap is page-based (604 cells), not calendar-based; no library fits |

## Architecture Patterns

### Recommended Project Structure
```
lawh-mobile/
  app/(main)/
    session.tsx              # NEW: Guided daily session screen
  components/hifz/
    TodaySession.tsx         # EXTEND: Add "Start Session" button, level-adaptive sizing
    HeatmapGrid.tsx          # NEW: 604-page mushaf heatmap
    DhorCycleTracker.tsx     # NEW: Circular/linear dhor progress
    SabaqPauseCard.tsx       # NEW: Encouraging pause state card
    LevelTransition.tsx      # NEW: Level change interstitial modal
    SessionTierCard.tsx      # NEW: Individual tier card in session flow
    QualityRating.tsx        # NEW: 1-5 quality rating buttons
    MadinahSessionSummary.tsx # NEW: Post-session summary for guided sessions
    MissedDayBanner.tsx      # NEW: Recovery prompt banner
  stores/
    madinahHifzStore.ts      # EXTEND: session completion, quality history, missed day detection
  lib/algorithm/             # NO CHANGES: Pure algorithm layer stays pure
```

### Pattern 1: Guided Session Flow (State Machine)
**What:** The session screen progresses through tiers linearly: sabaq -> sabqi -> dhor. Each tier shows its assignment, waits for the user to complete it, then advances.
**When to use:** Always for the main session flow.
**Example:**
```typescript
type SessionPhase = 'sabaq' | 'sabqi' | 'dhor' | 'summary'

interface GuidedSessionState {
  phase: SessionPhase
  sabaqCompleted: boolean
  sabqiIndex: number  // which sabqi assignment (can be multiple)
  dhorIndex: number   // which dhor entry
  ratings: Record<string, number>  // juz -> quality 1-5
}
```

### Pattern 2: Level-Adaptive Visual Weight
**What:** The TodaySession card and session screen allocate visual space proportionally to the sessionSplit config for the student's level.
**When to use:** In TodaySession card and session.tsx.
**Example:**
```typescript
// getLevelConfig(level).sessionSplit = [sabaq%, sabqi%, dhor%]
// Level 1: [50, 25, 25] -> sabaq card is 2x the height of others
// Level 4: [20, 30, 50] -> dhor card dominates
// Level 5: [0, 20, 80]  -> sabaq hidden, dhor nearly full screen

const config = getLevelConfig(studentLevel)
const [sabaqWeight, sabqiWeight, dhorWeight] = config.sessionSplit
// Use flex values proportional to weights
```

### Pattern 3: Page-to-Heatmap Cell Mapping
**What:** Map 604 mushaf pages to a grid of colored cells. Each cell's color derives from the juz's quality score and last-reviewed date.
**When to use:** HeatmapGrid component.
**Example:**
```typescript
// 604 pages, ~30 columns (one per juz), ~20 rows (pages per juz)
// Color: interpolate from quality score + days since review
function getPageColor(juz: number, qualityScores: Record<number, number>, isMemorized: boolean): string {
  if (!isMemorized) return GRAY
  const quality = qualityScores[juz] ?? 3.5
  // Map 1-5 quality to green-yellow-orange-red
  if (quality >= 4.0) return GREEN    // solid
  if (quality >= 3.0) return YELLOW   // moderate
  if (quality >= 2.0) return ORANGE   // stale
  return RED                           // weak
}
```

### Pattern 4: Store Extension (Not New Store)
**What:** Extend madinahHifzStore with new persisted fields rather than creating a new store. The session state is ephemeral (useState in session.tsx), but completions/history are persisted.
**When to use:** For all new persistent data.
**Example:**
```typescript
// Add to madinahHifzStore persisted state:
interface MadinahHifzState {
  // ... existing fields ...
  lastSessionDate: string | null       // ISO date, for missed day detection
  completedSessionDates: string[]      // Array of ISO dates for activity tracking
  previousLevel: StudentLevel | null   // For level transition detection
  sessionHistory: SessionRecord[]      // Last N sessions for heatmap/activity
}
```

### Anti-Patterns to Avoid
- **Creating a separate session store:** Keep session state in madinahHifzStore. The Madinah algorithm owns the session concept.
- **Mixing page-based and ayah-based grading:** The guided session uses 1-5 quality rating per juz/page-range (Madinah method), NOT the SM-2+ 0/2/3/5 grade system. These are separate systems.
- **Mutating algorithm functions:** The lib/algorithm/ layer is pure. All UI adaptations happen in the store or components, never by modifying the algorithm.
- **Over-engineering the heatmap:** At 604 cells, a simple SVG Rect grid is sufficient. Do not use canvas, WebView, or complex charting libraries.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session generation | Custom daily schedule logic | `generateDailySession()` from lib/algorithm | Already handles all level configs, non-active days, dhor rotation |
| Recovery plans | Custom missed-day logic | `generateRecoveryPlan()` from lib/algorithm | Handles clamping, catch-up day calculation, load spreading |
| Level determination | Custom threshold logic | `getStudentLevel()` from lib/algorithm | Handles fractional juz, 5-tier thresholds |
| Sabaq throttling | Custom pause logic | `getSabaqAllowance()` from lib/algorithm | Handles quality thresholds, consecutive weak days |
| Dhor rotation | Custom juz scheduling | `generateDhorCycle()` + `getDhorAssignment()` | Handles weak juz 2x repetition, page chunking |
| Haptic feedback | Custom haptic calls | `expo-haptics` with existing `withHaptic` pattern | Project pattern from Phase 7 |
| Blur reveal | Custom blur implementation | `expo-blur` BlurView as used in review.tsx | Already proven pattern |

**Key insight:** The entire algorithmic backbone for Phase 9 already exists in lib/algorithm/. This phase is purely a UI/UX layer on top of existing computation. The store needs minor extensions for tracking session history and missed days, but no new algorithm work is needed.

## Common Pitfalls

### Pitfall 1: Conflating Two Review Systems
**What goes wrong:** Mixing SM-2+ ayah-level grades (hifzStore) with Madinah method page-level quality ratings (madinahHifzStore). They serve different purposes.
**Why it happens:** Both exist in the same app and both deal with "reviewing" memorization.
**How to avoid:** The guided session screen writes ONLY to madinahHifzStore.juzQualityScores (1-5 scale). The existing review.tsx screen writes to hifzStore via SM-2+ (0/2/3/5 scale). Keep them separate. Future phases may bridge them.
**Warning signs:** Importing hifzService or sm2plus in the guided session screen.

### Pitfall 2: Stale Session After Midnight
**What goes wrong:** User opens app before midnight, crosses midnight, session data is for yesterday.
**Why it happens:** todaySession is generated on hydration/mount, not time-aware.
**How to avoid:** Compare `todaySession.sessionDate` with current date on each app foreground event. If different, call `generateToday()`.
**Warning signs:** Session date mismatch, stale dhor assignments.

### Pitfall 3: Heatmap Performance with 604 SVG Rects
**What goes wrong:** Rendering 604 individual SVG `<Rect>` elements causes jank on lower-end Android devices.
**Why it happens:** SVG rendering in React Native is not hardware accelerated.
**How to avoid:** Use a single SVG with pre-computed path data. Group by juz (30 columns) and batch-render. Consider `react-native-skia` if SVG proves too slow, but start with SVG.
**Warning signs:** FlatList scroll lag when heatmap is in view, initial render > 100ms.

### Pitfall 4: AsyncStorage Size Limits
**What goes wrong:** Storing full session history in AsyncStorage (via Zustand persist) eventually hits size limits or causes slow hydration.
**Why it happens:** Each session record adds to the persisted state.
**How to avoid:** Cap sessionHistory to last 90 days (rolling window). Prune on each session completion. Keep only essential data per record (date, totalPages, quality, level).
**Warning signs:** Slow app startup, hydration taking > 500ms.

### Pitfall 5: Dhor Day Number Desync
**What goes wrong:** dhorDayNumber in store doesn't advance, causing the same dhor assignment to repeat.
**Why it happens:** No mechanism to increment dhorDayNumber after session completion.
**How to avoid:** After a guided session is completed, increment dhorDayNumber and persist it. On missed days, advance by the number of missed days (the recovery plan handles the content).
**Warning signs:** Same juz appearing in dhor every day.

## Code Examples

### Quality Rating Component (1-5 Stars/Numbers)
```typescript
// Simpler than SM-2+ GradeBar, used for Madinah method dhor/sabqi rating
const QUALITY_OPTIONS = [
  { score: 1, label: 'Forgot', color: '#FF3B30' },
  { score: 2, label: 'Weak', color: '#FF9500' },
  { score: 3, label: 'Okay', color: '#FFCC00' },
  { score: 4, label: 'Good', color: '#34C759' },
  { score: 5, label: 'Perfect', color: '#007AFF' },
]

function QualityRating({ onRate }: { onRate: (score: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16 }}>
      {QUALITY_OPTIONS.map(({ score, label, color }) => (
        <Pressable
          key={score}
          onPress={() => onRate(score)}
          style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: color + '20', borderWidth: 1.5, borderColor: color }}
        >
          <Text style={{ color, fontSize: 16, fontWeight: '700' }}>{score}</Text>
          <Text style={{ color, fontSize: 10, fontWeight: '500' }}>{label}</Text>
        </Pressable>
      ))}
    </View>
  )
}
```

### Session Completion and Day Advance
```typescript
// Add to madinahHifzStore actions:
completeSession: (ratings: Record<number, number>) => {
  const state = get()
  const today = new Date().toISOString().slice(0, 10)

  // Update quality scores from session ratings
  const newScores = { ...state.juzQualityScores }
  for (const [juz, quality] of Object.entries(ratings)) {
    const juzNum = Number(juz)
    // Exponential moving average: 70% new rating, 30% old
    const old = newScores[juzNum] ?? 3.5
    newScores[juzNum] = old * 0.3 + quality * 0.7
  }

  set({
    juzQualityScores: newScores,
    dhorDayNumber: state.dhorDayNumber + 1,
    lastSessionDate: today,
    completedSessionDates: [...(state.completedSessionDates ?? []).slice(-89), today],
  })

  // Regenerate tomorrow's session
  setTimeout(() => get().generateToday(), 0)
}
```

### Missed Day Detection
```typescript
// Call on app foreground / hub mount
function detectMissedDays(lastSessionDate: string | null): number {
  if (!lastSessionDate) return 0
  const last = new Date(lastSessionDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  last.setHours(0, 0, 0, 0)
  const diffMs = today.getTime() - last.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays - 1) // -1 because yesterday is expected
}
```

### Heatmap Grid (SVG)
```typescript
// 30 columns (juz) x 20 rows (pages per juz) = 600 cells + 4 extra pages
import Svg, { Rect } from 'react-native-svg'

const CELL_SIZE = 10
const GAP = 1
const COLS = 30
const ROWS = 20

function HeatmapGrid({ memorizedJuz, qualityScores }: Props) {
  const memorizedSet = new Set(memorizedJuz)
  const cells = []

  for (let juz = 1; juz <= 30; juz++) {
    for (let page = 1; page <= 20; page++) {
      const col = juz - 1
      const row = page - 1
      const x = col * (CELL_SIZE + GAP)
      const y = row * (CELL_SIZE + GAP)
      const color = memorizedSet.has(juz)
        ? getQualityColor(qualityScores[juz] ?? 3.5)
        : '#333'
      cells.push(<Rect key={`${juz}-${page}`} x={x} y={y} width={CELL_SIZE} height={CELL_SIZE} fill={color} rx={2} />)
    }
  }

  return (
    <Svg width={COLS * (CELL_SIZE + GAP)} height={ROWS * (CELL_SIZE + GAP)}>
      {cells}
    </Svg>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Individual ayah review (SM-2+) | Page-range review with Madinah method | Quick-11/12 (2026-03-09) | Dual review systems coexist; guided session uses Madinah method |
| No daily session concept | TodaySession card shows sabaq/sabqi/dhor | Quick-12 (2026-03-09) | Foundation for guided session flow already exists |
| HifzSetup wizard (settingsStore) | MadinahSetup wizard (madinahHifzStore) | Quick-12 (2026-03-09) | Setup flow already captures memorized juz, sabaq position, active days |

**Important:** The existing hifzStore (SM-2+ per-ayah) and madinahHifzStore (Madinah method per-juz) are parallel systems. Phase 9 focuses on the Madinah method flow. The SM-2+ review system remains available via review.tsx for users who want granular ayah-level review.

## Open Questions

1. **Should the guided session actually navigate to mushaf pages?**
   - What we know: VISION.md says "you see the juz and page range. Recite from memory. Then a simple rating screen."
   - What's unclear: Does the user see mushaf text during dhor review, or just the assignment (juz + page range) and then self-rate?
   - Recommendation: Start with self-rating only (no mushaf text shown during guided dhor). Show the assignment, let user recite from memory, then rate. This matches the Madinah method pedagogy where dhor is recited from memory, not from the mushaf. Can add "peek" later.

2. **Weekly schedule view scope**
   - What we know: VISION.md mentions a weekly schedule view showing dhor rotation laid out across days.
   - What's unclear: Is this a priority for the initial implementation?
   - Recommendation: Defer to a follow-up. The dhor cycle tracker provides the core insight. A full weekly calendar view is nice-to-have.

3. **Level 5 (post-completion) UI transformation**
   - What we know: VISION.md describes a completely different UI for hafiz students with khatm tracking.
   - What's unclear: How many users will reach Level 5 at launch.
   - Recommendation: Implement the basic Level 5 state (sabaq hidden, dhor-dominant layout) but defer the full khatm tracker transformation. Show a simplified version.

4. **Activity heatmap (DASH-06) vs Mushaf heatmap (P9-03)**
   - What we know: DASH-06 wants a 12-week session intensity heatmap. VISION.md wants a 604-page mushaf confidence heatmap.
   - What's unclear: Are these the same component?
   - Recommendation: They are different. The mushaf heatmap (P9-03) shows memorization health per page. DASH-06 shows activity frequency over time (GitHub-style). Build the mushaf heatmap in this phase; defer DASH-06 to Phase 5.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (via Expo) |
| Config file | lawh-mobile/jest.config.js (if exists) or package.json jest config |
| Quick run command | `cd lawh-mobile && npx jest --testPathPattern=algorithm --no-coverage -x` |
| Full suite command | `cd lawh-mobile && npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| P9-01 | Session flow state machine transitions | unit | `npx jest --testPathPattern=session-flow -x` | No - Wave 0 |
| P9-02 | Level-adaptive weights from sessionSplit | unit | `npx jest --testPathPattern=level-calculator -x` | Yes (lib/algorithm/__tests__/) |
| P9-03 | Heatmap color mapping from quality scores | unit | `npx jest --testPathPattern=heatmap -x` | No - Wave 0 |
| P9-04 | Dhor cycle progress (day advancement, modulo wrap) | unit | `npx jest --testPathPattern=dhor-scheduler -x` | Yes (lib/algorithm/__tests__/) |
| P9-05 | Sabaq pause detection from getSabaqAllowance | unit | `npx jest --testPathPattern=sabaq-throttle -x` | Yes (lib/algorithm/__tests__/) |
| P9-06 | Quality rating score update (EMA calculation) | unit | `npx jest --testPathPattern=quality-rating -x` | No - Wave 0 |
| P9-07 | Missed day detection logic | unit | `npx jest --testPathPattern=missed-day -x` | No - Wave 0 |
| P9-08 | Level transition detection | unit | `npx jest --testPathPattern=level-calculator -x` | Yes |
| P9-09 | Session summary data aggregation | unit | `npx jest --testPathPattern=session-summary -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `cd lawh-mobile && npx jest --testPathPattern=algorithm --no-coverage -x`
- **Per wave merge:** `cd lawh-mobile && npx jest --no-coverage`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `lib/algorithm/__tests__/session-flow.test.ts` -- covers P9-01 (state machine transitions)
- [ ] `components/hifz/__tests__/heatmap.test.ts` -- covers P9-03 (color mapping logic)
- [ ] `stores/__tests__/madinahHifzStore.test.ts` -- covers P9-06, P9-07 (quality update, missed days)

## Sources

### Primary (HIGH confidence)
- Project codebase: lib/algorithm/ (types.ts, session-generator.ts, dhor-scheduler.ts, level-calculator.ts, sabaq-throttle.ts, recovery.ts)
- Project codebase: stores/madinahHifzStore.ts, stores/hifzStore.ts
- Project codebase: components/hifz/TodaySession.tsx, MadinahSetup.tsx
- Project codebase: app/(main)/review.tsx, app/(main)/hifz.tsx, app/(main)/hub.tsx
- VISION.md: Phase 9 product vision document

### Secondary (MEDIUM confidence)
- React Native SVG documentation for heatmap grid rendering approach
- Zustand persist middleware patterns (already proven in project)

### Tertiary (LOW confidence)
- None. All findings are based on codebase analysis and existing algorithm code.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and used in project
- Architecture: HIGH - patterns follow existing codebase conventions (stores, components, screens)
- Algorithm integration: HIGH - lib/algorithm/ is fully documented with types and tests
- Pitfalls: HIGH - derived from actual codebase analysis, not speculation

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable - no external API or library version concerns)

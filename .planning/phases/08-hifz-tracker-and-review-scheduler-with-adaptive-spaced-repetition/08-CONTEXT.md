# Phase 8: Hifz Tracker and Review Scheduler with Adaptive Spaced Repetition - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the memorization tracking system: a 114-surah hifz overview grid with per-ayah strength tracking, an SM-2+ spaced repetition engine with self-assessment grading, a review queue with urgency sorting, and two session modes (Review + New Memorization). All data stored locally in SQLite with future Supabase sync. AI grading (Phases 2-3) is not yet available — self-assessment grades drive SM-2+ until then.

</domain>

<decisions>
## Implementation Decisions

### Progress tracking (self-assessment grading)
- Users self-grade after reciting each ayah: **Again** (forgot) / **Hard** (struggled) / **Good** (correct with effort) / **Easy** (effortless) — 4-button Anki-style
- Self-assessment grades map directly to SM-2 quality values (Again=0, Hard=2, Good=3, Easy=5)
- When AI grading arrives (Phase 2-3): AI suggests a grade based on accuracy score, user can accept or override. Self-grade buttons remain but pre-filled with AI suggestion
- Users can manually mark ayahs as memorized/in-progress from the mushaf (long-press) AND from the hifz tracker grid — creates initial hifz_progress entries without requiring a session

### Surah overview visualization
- 5-column grid of compact surah cards showing all 114 surahs at a glance
- Each card shows surah number centered, entire card background color-coded by status:
  - Not started: neutral/empty
  - In progress: partial color
  - Memorized: full solid color
  - Needs review: warning/accent color
- Tapping a surah card opens a half-height bottom sheet with:
  - Surah name (Arabic + transliteration) and overall % memorized
  - Scrollable per-ayah rows: strength bar (0-100%), last reviewed date, next review due
  - Action buttons: Start Review, Mark as Memorized, Practice
- Grid lives in the hub's **Hifz tab** (replacing current placeholder)
- Full stats panel at top of Hifz tab: total memorized (X / 6,236 ayahs), overall percentage, strongest/weakest juz, average strength, review streak

### Review queue
- Review due count shown as a prominent badge/card on the **Dashboard tab** in the hub
- Tapping the review badge opens the review queue list sorted by urgency (most overdue first, then due today)
- Tapping "Start Review" begins a structured review session with all due ayahs

### Review session UI
- Mushaf page displayed with the target ayah text **blurred/hidden**
- User recites from memory, then taps "Reveal" to see the actual text and self-check
- After revealing, 4-button grade bar appears (Again/Hard/Good/Easy)
- Grading triggers SM-2+ update → shows new interval/next review date briefly → advances to next ayah
- Session ends when all due ayahs are reviewed → post-session summary

### New Memorization session
- User selects unmemorized ayahs to learn (from tracker or mushaf)
- Session shows the ayah text fully visible for reading/memorization
- After studying, user marks readiness → ayah status changes to "in_progress"
- Creates initial review_schedule entry with default interval (1 day)

### SM-2+ algorithm
- Full SM-2+ implementation: Wozniak formula with all enhancements
  - Proportional overdue credit (partial credit for late reviews)
  - Ease factor recovery after 3 consecutive correct answers
  - +/-10% interval jitter to prevent review clustering
  - Ease factor minimum clamped at 1.3
- Strength score (0.0-1.0) computed from SM-2+ repetition count and ease factor
- **Local TypeScript computation only** — runs immediately after each grade, zero latency
- Edge Function sync (SM2-04) deferred to a later phase

### Local data storage
- Mirror Supabase schema in local SQLite: hifz_progress + review_schedule tables
- Offline-first: all tracking works without internet
- Future Supabase sync when online (not in this phase)

### Claude's Discretion
- Exact color palette for the 4 status states (not started/in progress/memorized/needs review)
- Grid card size, spacing, and border radius
- Bottom sheet design for per-ayah detail
- Stats panel layout and data visualization (rings, bars, numbers)
- Blur/hide effect for review session (gaussian blur, opacity, or overlay)
- "Reveal" button design and animation
- Post-session summary layout
- New Memorization session flow details (ayah selection UI, study mode interactions)
- How manual marking integrates with existing AyahActionSheet (long-press)
- SQLite schema for local hifz/review tables
- Review queue list item design

</decisions>

<specifics>
## Specific Ideas

- The surah grid should feel like a Quran completion tracker — dense, scannable, satisfying to fill in as you memorize
- Review session with hidden text mimics real hifz practice: recite from memory, then check the mushaf
- 4-button Anki grading is familiar to serious memorizers who've used Anki for Quran
- AI transition should feel like an upgrade, not a replacement — user always has final say on their grade
- Stats panel should make progress feel tangible and motivating (X / 6,236 is a powerful number)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `hub.tsx`: Hub with 4 tabs (Dashboard/Goals/Hifz/Activity) — Hifz tab is a placeholder, Dashboard tab has "coming soon" box
- `hifz.tsx` + `review.tsx`: Placeholder route screens ready to be built out
- `quranService.ts`: Has `getAllSurahs()` with metadata (name, ayah count, revelation type, page start/end)
- `AyahActionSheet`: Existing long-press bottom sheet — can add "Mark as Memorized" action
- `settingsStore`: Has `dailyGoalMinutes`, `dailyGoalAyahs` — relevant for stats display
- `useResolvedTheme`: Dark mode hook used across all screens
- `expo-sqlite`: Already used for quran data (layout DB, words) — add hifz tables to same pattern

### Established Patterns
- Zustand stores with `persist` middleware for client state
- `expo-sqlite` `openDatabaseSync` + `importDatabaseFromAssetAsync` for bundled data
- `buildColors(isDark)` pattern for theme-aware component styling
- Bottom sheet pattern via Modal (used in AyahActionSheet, layout selector)
- `React.memo` + `useCallback` on all mushaf components

### Integration Points
- Hub Hifz tab: Replace `PlaceholderTab` with the surah grid component
- Hub Dashboard tab: Replace "coming soon" box with review due card + stats
- `AyahActionSheet`: Add "Mark as Memorized" / "Mark for Review" actions
- MushafScreen: Review session needs to render mushaf pages with blur overlay
- New SQLite tables need migration/creation on first use (no bundled asset — created at runtime)

</code_context>

<deferred>
## Deferred Ideas

- Supabase sync for hifz data — future phase (local-only for now)
- Edge Function for review schedule computation (SM2-04) — future phase
- Activity heatmap and full dashboard — Phase 5
- Juz view in hifz tracker (EXTF-02) — v2
- Page view in hifz tracker (EXTF-03) — v2
- Free Recitation session mode (EXTF-06) — v2

</deferred>

---

*Phase: 08-hifz-tracker-and-review-scheduler-with-adaptive-spaced-repetition*
*Context gathered: 2026-03-08*

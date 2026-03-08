# Phase 8: Hifz Tracker and Review Scheduler with Adaptive Spaced Repetition - Research

**Researched:** 2026-03-08
**Domain:** Spaced repetition engine, memorization tracking UI, local SQLite storage
**Confidence:** HIGH

## Summary

Phase 8 builds the core memorization tracking system: a 114-surah hifz overview grid, per-ayah strength tracking with SM-2+ spaced repetition, a review queue with urgency sorting, and two session modes (Review + New Memorization). All data is stored locally in SQLite via `expo-sqlite` (already in the project at v55.0.10) with self-assessment grading driving the SM-2+ algorithm. AI grading (from Phases 2-3) is not yet available.

The implementation is entirely local/offline-first. The Supabase schema already defines `hifz_progress` and `review_schedule` tables that serve as the canonical schema -- the local SQLite tables should mirror these exactly. The SM-2+ algorithm is a pure TypeScript computation with no external dependencies needed. The UI integrates into the existing hub's Hifz tab (replacing `PlaceholderTab`), adds a review badge to the Dashboard tab, adds "Mark as Memorized" to `AyahActionSheet`, and creates review/memorization session screens using the existing `review.tsx` and `hifz.tsx` placeholder routes.

**Primary recommendation:** Implement SM-2+ as a pure function module (`lib/sr/sm2plus.ts`), create a `hifzService.ts` mirroring the `quranService.ts` pattern for SQLite operations, and build a Zustand `hifzStore.ts` for reactive state. Use `expo-blur` (already installed) for the review session blur overlay.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Users self-grade after reciting each ayah: Again (forgot) / Hard (struggled) / Good (correct with effort) / Easy (effortless) -- 4-button Anki-style
- Self-assessment grades map directly to SM-2 quality values (Again=0, Hard=2, Good=3, Easy=5)
- When AI grading arrives (Phase 2-3): AI suggests a grade based on accuracy score, user can accept or override
- Users can manually mark ayahs as memorized/in-progress from the mushaf (long-press) AND from the hifz tracker grid
- 5-column grid of compact surah cards showing all 114 surahs
- Card background color-coded by status (not started / in progress / memorized / needs review)
- Tapping surah card opens half-height bottom sheet with per-ayah detail
- Grid lives in hub's Hifz tab (replacing current placeholder)
- Full stats panel at top of Hifz tab
- Review due count as badge/card on Dashboard tab
- Review queue sorted by urgency (most overdue first, then due today)
- Review session: mushaf page with target ayah text blurred/hidden, user recites, taps Reveal, then grades
- New Memorization session: ayah text fully visible, user marks readiness
- SM-2+ with Wozniak formula: proportional overdue credit, ease factor recovery after 3 consecutive correct, +/-10% interval jitter, ease factor minimum 1.3
- Strength score (0.0-1.0) computed from SM-2+ repetition count and ease factor
- Local TypeScript computation only -- zero latency
- Mirror Supabase schema in local SQLite: hifz_progress + review_schedule tables
- Offline-first: all tracking works without internet
- Supabase sync deferred to later phase

### Claude's Discretion
- Exact color palette for the 4 status states
- Grid card size, spacing, and border radius
- Bottom sheet design for per-ayah detail
- Stats panel layout and data visualization
- Blur/hide effect for review session (gaussian blur, opacity, or overlay)
- "Reveal" button design and animation
- Post-session summary layout
- New Memorization session flow details
- How manual marking integrates with existing AyahActionSheet
- SQLite schema for local hifz/review tables
- Review queue list item design

### Deferred Ideas (OUT OF SCOPE)
- Supabase sync for hifz data -- future phase (local-only for now)
- Edge Function for review schedule computation (SM2-04) -- future phase
- Activity heatmap and full dashboard -- Phase 5
- Juz view in hifz tracker (EXTF-02) -- v2
- Page view in hifz tracker (EXTF-03) -- v2
- Free Recitation session mode (EXTF-06) -- v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HIFZ-01 | 114-surah color-coded grid (not started/in progress/memorized/needs review) | Hub Hifz tab replaces PlaceholderTab; 5-column FlatList grid; status colors from hifzStore |
| HIFZ-02 | Tap surah for per-ayah strength bars (0-100%) | Half-height Modal bottom sheet; hifzService queries local SQLite for ayah progress |
| HIFZ-03 | Each ayah shows last reviewed date, next review due, historical mistake count | review_schedule table has due_date; hifz_progress has updated_at; mistake count derived from repetitions with low grades |
| HIFZ-04 | Mark individual ayahs as memorized, schedule review, or practice | AyahActionSheet integration + bottom sheet actions; creates/updates hifz_progress entries |
| HIFZ-05 | Stats panel: total memorized / 6,236, strongest/weakest juz | Aggregate query on hifz_progress; juzBoundaries.ts provides juz mapping |
| SM2-01 | SM-2+ algorithm with Wozniak formula + modifications | Pure TS module; overdue credit, ease recovery, jitter, min EF 1.3 |
| SM2-02 | Per-ayah strength score (0.0-1.0) from SM-2+ repetition count | Computed: `min(1.0, (reps * EF) / (reps * EF + 5))` or similar sigmoid |
| SM2-03 | Review schedule computed locally in TypeScript | sm2plus.ts module; called immediately after each grade |
| SM2-05 | Ease factor minimum 1.3 with recovery mechanism | Clamp in SM-2+ update; recovery after 3 consecutive correct (quality >= 3) |
| REVW-01 | Review queue sorted by urgency (overdue first, then due today) | SQLite query: `WHERE due_date <= date('now') ORDER BY due_date ASC` |
| REVW-02 | Per ayah: user recites, grades (self-assessment), SM-2+ updates, next review shown | Review session screen with blur overlay + grade buttons |
| REVW-03 | Start auto-built review session from queue | Dashboard badge navigates to review screen with pre-loaded queue |
| SESS-01 | New Memorization session for unmemorized ayahs | New memorization screen; creates initial hifz_progress + review_schedule entries |
| SESS-02 | Review session from review queue | Review screen loads due ayahs, presents in blur-reveal-grade loop |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-sqlite | ~55.0.10 | Local hifz/review SQLite storage | Already used for layout DB; `openDatabaseSync` for sync reads |
| zustand | ^5.0.11 | Reactive hifz state (progress, queue counts, session) | Already used for settingsStore; persist middleware for offline |
| expo-blur | ~55.0.8 | Review session text blur overlay | Already installed; `BlurView` used in MushafFooter |
| expo-haptics | ~55.0.8 | Grade button feedback, mark-as-memorized | Already used throughout app |
| react-native-reanimated | ^4.2.1 | Reveal animation, strength bar transitions | Already installed |

### No New Dependencies Needed
The entire phase can be built with existing dependencies. SM-2+ is implemented as a pure TypeScript function (50-80 lines). No npm libraries needed for spaced repetition -- the algorithm is simple enough that hand-rolling is preferred over adding a dependency.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled SM-2+ | `supermemo` npm package | Package is SM-2 only (no overdue credit, no jitter); context decisions require SM-2+ modifications that the package does not support |
| expo-sqlite direct | drizzle-orm + expo-sqlite | Adds ORM complexity for only 2 tables; overkill; project pattern uses raw SQL |
| Modal bottom sheet | @gorhom/bottom-sheet | Would add new dependency; project uses Modal pattern consistently |

## Architecture Patterns

### Recommended Project Structure
```
lawh-mobile/
  lib/
    sr/
      sm2plus.ts          # Pure SM-2+ algorithm (no side effects)
      sm2plus.test.ts     # Unit tests for algorithm
      types.ts            # ReviewCard, Grade, SM2Result types
  services/
    hifzService.ts        # SQLite CRUD for hifz_progress + review_schedule
  stores/
    hifzStore.ts           # Zustand store: progress map, queue count, session state
  components/
    hifz/
      SurahGrid.tsx        # 114-surah 5-column grid
      SurahCard.tsx        # Individual surah card with status color
      SurahDetailSheet.tsx # Half-height bottom sheet with per-ayah rows
      AyahProgressRow.tsx  # Single ayah row: strength bar, dates
      StatsPanel.tsx       # Top stats (total memorized, juz stats)
      ReviewBadge.tsx      # Dashboard tab review due count
    session/
      ReviewSession.tsx    # Blur-reveal-grade session flow
      GradeBar.tsx         # 4-button Again/Hard/Good/Easy bar
      SessionSummary.tsx   # Post-session summary
      NewMemSession.tsx    # New memorization session flow
```

### Pattern 1: Local SQLite Database Creation (Runtime)
**What:** Create hifz/review tables on first app launch (not bundled asset)
**When to use:** Tables that store user data locally, created at runtime
**Example:**
```typescript
// hifzService.ts - mirrors Supabase schema
import { openDatabaseSync } from 'expo-sqlite'

const HIFZ_DB_NAME = 'lawh-hifz.db'
let db: ReturnType<typeof openDatabaseSync> | null = null

function getDb() {
  if (!db) {
    db = openDatabaseSync(HIFZ_DB_NAME)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS hifz_progress (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        surah_id INTEGER NOT NULL,
        ayah_number INTEGER NOT NULL,
        riwayah TEXT NOT NULL DEFAULT 'hafs',
        status TEXT NOT NULL DEFAULT 'not_started'
          CHECK (status IN ('not_started','in_progress','memorized','needs_review')),
        strength_score REAL NOT NULL DEFAULT 0.0
          CHECK (strength_score BETWEEN 0.0 AND 1.0),
        mistake_count INTEGER NOT NULL DEFAULT 0,
        consecutive_correct INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE (surah_id, ayah_number, riwayah)
      );

      CREATE TABLE IF NOT EXISTS review_schedule (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        surah_id INTEGER NOT NULL,
        ayah_number INTEGER NOT NULL,
        riwayah TEXT NOT NULL DEFAULT 'hafs',
        due_date TEXT NOT NULL,
        interval_days REAL NOT NULL DEFAULT 1.0,
        ease_factor REAL NOT NULL DEFAULT 2.5,
        repetitions INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE (surah_id, ayah_number, riwayah)
      );

      CREATE INDEX IF NOT EXISTS idx_review_due
        ON review_schedule(due_date);
      CREATE INDEX IF NOT EXISTS idx_hifz_surah
        ON hifz_progress(surah_id);
    `)
  }
  return db
}
```

### Pattern 2: SM-2+ Pure Function
**What:** Stateless SM-2+ computation with all required modifications
**When to use:** After every grade submission
**Example:**
```typescript
// lib/sr/sm2plus.ts

export type Grade = 0 | 1 | 2 | 3 | 4 | 5  // Again=0, Hard=2, Good=3, Easy=5

export interface ReviewCard {
  easeFactor: number    // >= 1.3
  interval: number      // days (float)
  repetitions: number
  dueDate: string       // ISO date
  consecutiveCorrect: number
}

export interface SM2Result {
  easeFactor: number
  interval: number
  repetitions: number
  dueDate: string
  consecutiveCorrect: number
  strengthScore: number
}

export function sm2plus(card: ReviewCard, grade: Grade, today: Date = new Date()): SM2Result {
  const MIN_EF = 1.3
  let { easeFactor, interval, repetitions, consecutiveCorrect } = card

  // Calculate days overdue for proportional credit
  const dueDate = new Date(card.dueDate)
  const daysOverdue = Math.max(0, (today.getTime() - dueDate.getTime()) / 86400000)

  if (grade < 2) {
    // Failed: reset
    repetitions = 0
    interval = 1
    consecutiveCorrect = 0
  } else {
    // Passed
    consecutiveCorrect += 1

    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      // Proportional overdue credit: add partial credit for late reviews
      const overdueCredit = grade >= 3 ? Math.min(daysOverdue, interval) / interval : 0
      interval = interval * easeFactor * (1 + overdueCredit * 0.1)
    }

    // Ease factor update (Wozniak formula)
    easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))

    // Ease factor recovery: boost after 3 consecutive correct
    if (consecutiveCorrect >= 3 && easeFactor < 2.5) {
      easeFactor += 0.05
    }

    // Clamp ease factor
    easeFactor = Math.max(MIN_EF, easeFactor)

    // Interval jitter: +/-10%
    const jitter = 1 + (Math.random() * 0.2 - 0.1)
    interval = Math.max(1, interval * jitter)

    repetitions += 1
  }

  // Compute strength score (sigmoid-like, 0.0-1.0)
  const strengthScore = Math.min(1.0, (repetitions * easeFactor) / (repetitions * easeFactor + 8))

  // Compute next due date
  const nextDue = new Date(today)
  nextDue.setDate(nextDue.getDate() + Math.round(interval))
  const nextDueStr = nextDue.toISOString().split('T')[0]

  return {
    easeFactor: Math.round(easeFactor * 100) / 100,
    interval: Math.round(interval * 10) / 10,
    repetitions,
    dueDate: nextDueStr,
    consecutiveCorrect,
    strengthScore: Math.round(strengthScore * 1000) / 1000,
  }
}
```

### Pattern 3: Zustand Store with SQLite Backing
**What:** Reactive store that loads from SQLite, writes through on mutations
**When to use:** hifzStore needs to be reactive for UI but persisted in SQLite
**Example:**
```typescript
// stores/hifzStore.ts
import { create } from 'zustand'
import { hifzService } from '@/services/hifzService'

interface HifzState {
  surahStatuses: Map<number, SurahStatus>  // surahId -> aggregated status
  reviewDueCount: number
  totalMemorized: number
  loaded: boolean
  loadProgress: () => Promise<void>
  gradeAyah: (surahId: number, ayah: number, grade: Grade) => void
  markMemorized: (surahId: number, ayah: number) => void
}
```

### Anti-Patterns to Avoid
- **Storing SM-2+ state in AsyncStorage/Zustand only:** Use SQLite for the 6,236-row dataset. AsyncStorage serialization would be too slow and the data is relational.
- **Querying Supabase for hifz data:** This phase is local-only. No network calls for progress data.
- **Computing review queue on every render:** Cache the queue count in the store, recompute only after grading.
- **Using `importDatabaseFromAssetAsync` for hifz DB:** That pattern is for bundled read-only data. Hifz tables are user-writable, created with `CREATE TABLE IF NOT EXISTS` via `openDatabaseSync`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom sheet | Custom animated view | Modal (existing pattern) | Consistent with AyahActionSheet, layout selector; Modal is simpler |
| Blur overlay | Custom opacity/overlay | expo-blur `BlurView` | Already installed and used in MushafFooter; native performance |
| Haptic feedback | Custom vibration | expo-haptics (existing) | Already imported throughout the app |
| Date formatting | Manual string ops | `toLocaleDateString()` / `Intl.DateTimeFormat` | Locale-aware, handles edge cases |
| UUID generation | crypto.randomUUID | `lower(hex(randomblob(16)))` in SQLite | SQLite default expression; no JS dependency for IDs |

**Key insight:** The SM-2+ algorithm IS hand-rolled intentionally -- it is only ~50 lines, the npm packages do not support the required modifications (overdue credit, ease recovery, jitter), and it must be unit-testable as a pure function.

## Common Pitfalls

### Pitfall 1: SQLite Thread Blocking on Large Queries
**What goes wrong:** Querying all 6,236 ayahs' progress synchronously blocks the JS thread
**Why it happens:** `execSync`/`getAllSync` are synchronous; large result sets freeze the UI
**How to avoid:** Query per-surah (max 286 ayahs for Al-Baqarah), not all at once. Cache surah-level aggregates in the store. Use `runAsync` for bulk operations.
**Warning signs:** UI jank when opening the Hifz tab

### Pitfall 2: Ease Factor Death Spiral
**What goes wrong:** Ease factor drops to minimum (1.3) and never recovers, making intervals very short
**Why it happens:** SM-2 decreases EF on every non-perfect grade; users who consistently grade "Hard" see EF collapse
**How to avoid:** Implement ease factor recovery: after 3 consecutive correct answers (grade >= 3), add 0.05 to EF. This is explicitly required by the context decisions.
**Warning signs:** All review intervals stuck at 1-3 days after weeks of use

### Pitfall 3: Review Clustering
**What goes wrong:** Many ayahs become due on the same day, overwhelming the user
**Why it happens:** Similar intervals produce synchronized review dates
**How to avoid:** Apply +/-10% jitter to computed intervals (required by context). Also, the review queue should limit batch size (e.g., 20-30 ayahs per session).
**Warning signs:** Review due count spikes to 100+ on certain days

### Pitfall 4: Stale Store State After SQLite Mutation
**What goes wrong:** UI shows old data after grading because store was not refreshed
**Why it happens:** SQLite write succeeds but Zustand store still has cached values
**How to avoid:** Every SQLite mutation (grade, mark memorized) must also update the Zustand store atomically. Use a write-through pattern: update SQLite, then `set()` in Zustand.
**Warning signs:** Progress appears unchanged after grading; requires tab switch to see updates

### Pitfall 5: Missing Riwayah in Queries
**What goes wrong:** Queries return wrong data for non-Hafs users in future
**Why it happens:** Forgetting to include `riwayah` in WHERE clauses
**How to avoid:** Always include `AND riwayah = ?` in every query. Mirror the Supabase schema's composite unique constraint `(surah_id, ayah_number, riwayah)`.
**Warning signs:** None now (only Hafs exists), but would break multi-riwayah support later

## Code Examples

### Review Queue Query
```typescript
// Get all due ayahs sorted by urgency
function getReviewQueue(riwayah: string): ReviewQueueItem[] {
  const db = getDb()
  const today = new Date().toISOString().split('T')[0]
  return db.getAllSync<ReviewQueueItem>(
    `SELECT rs.surah_id, rs.ayah_number, rs.due_date, rs.interval_days,
            rs.ease_factor, rs.repetitions,
            hp.strength_score, hp.status
     FROM review_schedule rs
     JOIN hifz_progress hp
       ON rs.surah_id = hp.surah_id
       AND rs.ayah_number = hp.ayah_number
       AND rs.riwayah = hp.riwayah
     WHERE rs.due_date <= ?
       AND rs.riwayah = ?
     ORDER BY rs.due_date ASC`,
    [today, riwayah]
  )
}
```

### Surah Status Aggregation
```typescript
// Get aggregated status for all 114 surahs (for grid display)
function getSurahStatuses(riwayah: string): SurahStatusMap {
  const db = getDb()
  const rows = db.getAllSync<{
    surah_id: number
    total: number
    memorized: number
    in_progress: number
    needs_review: number
  }>(
    `SELECT surah_id,
            COUNT(*) as total,
            SUM(CASE WHEN status = 'memorized' THEN 1 ELSE 0 END) as memorized,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'needs_review' THEN 1 ELSE 0 END) as needs_review
     FROM hifz_progress
     WHERE riwayah = ?
     GROUP BY surah_id`,
    [riwayah]
  )
  // Map to statuses...
}
```

### Grade Submission Flow
```typescript
// Complete grade flow: SM-2+ compute -> SQLite update -> store refresh
function gradeAyah(surahId: number, ayahNumber: number, grade: Grade, riwayah: string) {
  const db = getDb()

  // 1. Read current card state
  const schedule = db.getFirstSync<ReviewScheduleRow>(
    `SELECT * FROM review_schedule
     WHERE surah_id = ? AND ayah_number = ? AND riwayah = ?`,
    [surahId, ayahNumber, riwayah]
  )

  // 2. Compute SM-2+ result
  const card: ReviewCard = {
    easeFactor: schedule?.ease_factor ?? 2.5,
    interval: schedule?.interval_days ?? 1,
    repetitions: schedule?.repetitions ?? 0,
    dueDate: schedule?.due_date ?? new Date().toISOString().split('T')[0],
    consecutiveCorrect: 0, // track in progress table
  }
  const result = sm2plus(card, grade)

  // 3. Write to SQLite
  db.runSync(
    `INSERT INTO review_schedule (surah_id, ayah_number, riwayah, due_date, interval_days, ease_factor, repetitions, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT (surah_id, ayah_number, riwayah)
     DO UPDATE SET due_date=?, interval_days=?, ease_factor=?, repetitions=?, updated_at=datetime('now')`,
    [surahId, ayahNumber, riwayah, result.dueDate, result.interval, result.easeFactor, result.repetitions,
     result.dueDate, result.interval, result.easeFactor, result.repetitions]
  )

  // 4. Update hifz_progress strength
  db.runSync(
    `UPDATE hifz_progress SET strength_score = ?, updated_at = datetime('now')
     WHERE surah_id = ? AND ayah_number = ? AND riwayah = ?`,
    [result.strengthScore, surahId, ayahNumber, riwayah]
  )

  // 5. Update store (reactive UI update)
  // ... zustand set() calls
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SM-2 (1987) | SM-2+ / FSRS (2023+) | 2023 | FSRS is more accurate but complex; SM-2+ is the right complexity for this project |
| AsyncStorage for relational data | expo-sqlite sync API | Expo SDK 50+ | Sync API allows immediate reads without async overhead |
| `expo-sqlite/legacy` | `expo-sqlite` (new API) | Expo SDK 50 | New API with `openDatabaseSync`, typed results, better performance |

## Open Questions

1. **Consecutive correct counter storage**
   - What we know: SM-2+ ease recovery requires tracking 3+ consecutive correct answers
   - What's unclear: Supabase schema does not have a `consecutive_correct` column
   - Recommendation: Add it to local SQLite only (not in Supabase schema yet). Column `consecutive_correct INTEGER DEFAULT 0` in `hifz_progress`. Will need migration when sync is added.

2. **Mistake count tracking**
   - What we know: HIFZ-03 requires "historical mistake count" per ayah
   - What's unclear: No column in Supabase schema for this
   - Recommendation: Add `mistake_count INTEGER DEFAULT 0` to local `hifz_progress`. Increment on grade < 2 (Again).

3. **Review session batch size**
   - What we know: All due ayahs should be reviewable
   - What's unclear: Performance with 100+ ayahs in a single session
   - Recommendation: Load all due, present in batches of 20. Show "Continue" between batches. First batch loads immediately.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + jest-expo 55.0.9 |
| Config file | `lawh-mobile/jest.config.js` |
| Quick run command | `cd lawh-mobile && npx jest --testPathPattern=sr/ --no-coverage` |
| Full suite command | `cd lawh-mobile && npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SM2-01 | SM-2+ with overdue credit, recovery, jitter, min EF | unit | `npx jest lib/sr/sm2plus.test.ts -x` | No -- Wave 0 |
| SM2-02 | Strength score 0.0-1.0 from reps + EF | unit | `npx jest lib/sr/sm2plus.test.ts -x` | No -- Wave 0 |
| SM2-03 | Local TypeScript computation | unit | `npx jest lib/sr/sm2plus.test.ts -x` | No -- Wave 0 |
| SM2-05 | EF minimum 1.3 + recovery | unit | `npx jest lib/sr/sm2plus.test.ts -x` | No -- Wave 0 |
| HIFZ-01 | 114-surah grid with statuses | manual-only | Visual verification on device | N/A |
| HIFZ-02 | Per-ayah strength bars | manual-only | Visual verification on device | N/A |
| HIFZ-05 | Stats aggregation | unit | `npx jest services/hifzService.test.ts -x` | No -- Wave 0 |
| REVW-01 | Queue sorted by urgency | unit | `npx jest services/hifzService.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd lawh-mobile && npx jest --testPathPattern="sr|hifz" --no-coverage`
- **Per wave merge:** `cd lawh-mobile && npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `lawh-mobile/lib/sr/sm2plus.test.ts` -- covers SM2-01, SM2-02, SM2-03, SM2-05
- [ ] `lawh-mobile/__tests__/services/hifzService.test.ts` -- covers HIFZ-05, REVW-01
- [ ] expo-sqlite mock setup for jest (SQLite not available in test environment)

## Sources

### Primary (HIGH confidence)
- Supabase migration `001_initial_schema.sql` -- canonical `hifz_progress` and `review_schedule` table schemas
- Existing codebase: `quranService.ts`, `settingsStore.ts`, `hub.tsx`, `AyahActionSheet.tsx`, `MushafScreen.tsx` -- established patterns
- `package.json` -- all dependencies confirmed installed at specified versions

### Secondary (MEDIUM confidence)
- [SM-2+ Algorithm (BlueRaja)](https://www.blueraja.com/blog/477/a-better-spaced-repetition-learning-algorithm-sm2) -- SM-2+ formula with overdue credit, difficulty weighting
- [SM-2 Algorithm Explained (Tegaru)](https://tegaru.app/en/blog/sm2-algorithm-explained) -- SM-2 base formula reference
- [Expo SQLite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/) -- sync API, `openDatabaseSync`, `execSync`

### Tertiary (LOW confidence)
- [supermemo npm](https://www.npmjs.com/supermemo) -- evaluated and rejected (lacks SM-2+ modifications)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and used in the project
- Architecture: HIGH -- mirrors existing patterns (quranService, settingsStore, Modal sheets)
- SM-2+ algorithm: HIGH -- well-documented algorithm, pure function, easily testable
- Pitfalls: MEDIUM -- based on general SRS implementation experience; project-specific issues may surface
- SQLite schema: HIGH -- directly mirrors Supabase schema with 2 local-only columns added

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable domain, no fast-moving dependencies)

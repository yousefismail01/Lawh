# Architecture Research

**Domain:** AI-powered Quran Hifz & Recitation Correction Mobile App
**Researched:** 2026-03-04
**Confidence:** HIGH (stack is well-defined in PROJECT.md; patterns drawn from official Expo/Supabase/FastAPI docs and production examples)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Mobile Client (Expo)                         │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────┐  │
│  │  UI Screens  │  │ Zustand Store│  │ expo-sqlite│  │expo-audio  │  │
│  │  (React Nav) │  │ (App State)  │  │ (Local DB) │  │(Recorder)  │  │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  └─────┬──────┘  │
│         │                 │                 │               │          │
│  ┌──────▼─────────────────▼─────────────────▼───────────────▼──────┐  │
│  │                    Service Layer (TypeScript)                     │  │
│  │  RecitationService  |  HifzService  |  ReviewService  | AuthSvc  │  │
│  └──────────────┬──────────────────────────┬────────────────────────┘  │
└─────────────────┼──────────────────────────┼──────────────────────────┘
                  │                          │
          (multipart/form-data)        (REST/Realtime)
          (WAV + metadata)            (JWT auth)
                  │                          │
    ┌─────────────▼──────────┐  ┌────────────▼────────────────────────┐
    │  FastAPI Inference      │  │           Supabase                  │
    │  (EC2 g4dn.xlarge)      │  │                                     │
    │                        │  │  ┌──────────┐  ┌──────────────────┐  │
    │  ┌──────────────────┐  │  │  │  Auth    │  │  PostgreSQL DB   │  │
    │  │ whisper-base-ar  │  │  │  │ (JWT)    │  │  (10 tables+RLS) │  │
    │  │ (ASR transcript) │  │  │  └──────────┘  └──────────────────┘  │
    │  │ wav2vec2-phoneme │  │  │  ┌──────────┐  ┌──────────────────┐  │
    │  │ (Tajweed FSM)    │  │  │  │ Storage  │  │  Edge Functions  │  │
    │  │ wav2vec2-word    │  │  │  │ (audio)  │  │  (SM-2, streaks) │  │
    │  │ (word boundaries)│  │  │  └──────────┘  └──────────────────┘  │
    │  └──────────────────┘  │  │                                     │
    │  (writes via svc key)  │──►│  (receives inference results)       │
    └────────────────────────┘  └─────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| Expo UI Layer | Screen rendering, navigation, RTL Arabic display | React Native + Expo Router |
| Zustand Store | In-memory app state, session data, pending upload queue | Zustand + MMKV persist |
| expo-sqlite (Local DB) | Offline Quran text cache, progress, SM-2 schedule | expo-sqlite v14+ |
| expo-audio | 16kHz mono WAV recording, permission management | expo-audio |
| Service Layer | Business logic abstraction, offline queue, retry | TypeScript classes/hooks |
| Supabase Auth | JWT issuance, session refresh, OAuth (Apple/Google) | Supabase @supabase/supabase-js |
| Supabase PostgreSQL | User data, ayah strength, review schedule, violations | 10 tables, full RLS |
| Supabase Edge Functions | SM-2 calc, streak updates, achievement unlocks, push cron | Deno-based Supabase Functions |
| Supabase Storage | Optional: persisted audio uploads for replay/audit | Supabase Storage buckets |
| FastAPI Inference Server | Audio → transcript, word boundaries, Tajweed violations | FastAPI on EC2 g4dn.xlarge |
| Whisper ASR (tarteel-ai) | Arabic Quran speech → text transcript | HuggingFace model, int8 |
| Wav2Vec2 Phoneme | Phoneme sequence extraction for Tajweed FSM | HuggingFace model, int8 |
| Wav2Vec2 Word | Word-level timestamp boundaries | HuggingFace model, int8 |
| Tajweed FSM | 13+ Tajweed rule detection from phoneme sequences | Python FSM in inference server |

---

## Recommended Project Structure

```
lawh/
├── app/                        # Expo Router screens (file-based routing)
│   ├── (auth)/                 # Auth group: login, register, onboarding
│   ├── (tabs)/                 # Main tab navigation
│   │   ├── index.tsx           # Dashboard (streak, daily goal, weak spots)
│   │   ├── hifz.tsx            # Hifz tracker (surah/juz/page views)
│   │   ├── review.tsx          # Review queue with SM-2 urgency sort
│   │   └── profile.tsx         # Analytics, achievements, settings
│   ├── session/
│   │   ├── [mode].tsx          # Recitation session (new/review/free/drill)
│   │   └── results.tsx         # Post-session analysis screen
│   └── _layout.tsx             # Root layout, auth gate
│
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── arabic/             # AyahText, TajweedHighlight, RTL containers
│   │   ├── audio/              # RecordButton, WaveformVisualizer
│   │   └── hifz/               # SurahGrid, JuzView, StrengthBar
│   │
│   ├── stores/                 # Zustand state slices
│   │   ├── session.store.ts    # Active session: recording state, current ayah
│   │   ├── hifz.store.ts       # Loaded Hifz data, strength cache
│   │   ├── review.store.ts     # Review queue state
│   │   ├── upload.store.ts     # Pending audio upload queue (offline)
│   │   └── auth.store.ts       # User, session JWT
│   │
│   ├── services/               # Business logic, external calls
│   │   ├── recitation/
│   │   │   ├── recorder.ts     # expo-audio wrapper: start/stop/getURI
│   │   │   ├── uploader.ts     # Multipart POST to FastAPI, retry logic
│   │   │   └── corrector.ts    # Map inference response → UI error objects
│   │   ├── hifz/
│   │   │   ├── tracker.ts      # Ayah strength read/write to SQLite + Supabase
│   │   │   └── scheduler.ts    # SM-2 next interval calculation (local)
│   │   ├── quran/
│   │   │   ├── db.ts           # expo-sqlite queries for ayahs, metadata
│   │   │   └── normalizer.ts   # NFC, tashkeel strip, hamza normalization
│   │   └── auth/
│   │       └── auth.service.ts # Supabase auth: sign in, Apple/Google OAuth
│   │
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client (anon key only)
│   │   ├── sqlite.ts           # expo-sqlite db initialization, migrations
│   │   └── constants.ts        # Riwayah enum, Tajweed rule IDs, colors
│   │
│   ├── types/                  # Shared TypeScript types
│   │   ├── quran.ts            # Ayah, Surah, Riwayah, TajweedRule
│   │   ├── session.ts          # RecitationResult, WordError, Violation
│   │   └── hifz.ts             # AyahStrength, ReviewCard, SM2State
│   │
│   └── hooks/                  # Custom React hooks
│       ├── useRecitationSession.ts
│       ├── useOfflineSync.ts
│       └── useReviewQueue.ts
│
├── inference/                  # FastAPI server (separate deployment)
│   ├── main.py                 # FastAPI app, /analyze endpoint
│   ├── models/
│   │   ├── loader.py           # Load all 3 models at startup into GPU VRAM
│   │   ├── asr.py              # Whisper inference wrapper
│   │   ├── phoneme.py          # Wav2Vec2 phoneme extraction
│   │   └── word_align.py       # Word boundary detection
│   ├── tajweed/
│   │   ├── fsm.py              # Finite State Machine: phonemes → violations
│   │   └── rules.py            # 13+ Tajweed rule definitions, severity, labels
│   ├── supabase_client.py      # Service role key client, writes results to DB
│   └── requirements.txt
│
└── supabase/
    ├── migrations/             # SQL migration files
    ├── functions/
    │   ├── calculate-review-schedule/   # SM-2 edge function
    │   ├── update-streak/               # Streak logic
    │   ├── unlock-achievements/         # Achievement checks
    │   └── send-review-reminder/        # Cron push notification
    └── seed/
        └── quran.sql           # quran-json data seed (full tashkeel, riwayah field)
```

### Structure Rationale

- **app/ (Expo Router):** File-based routing keeps screens co-located with navigation, Expo Router handles deep linking and auth guards natively.
- **src/stores/:** One Zustand slice per domain concern. upload.store.ts is the single source of truth for the offline audio queue — no audio upload ever bypasses it.
- **src/services/:** All external calls are in services, never directly in components or stores. This makes offline fallback testable in isolation.
- **inference/:** FastAPI server is a completely separate deployment artifact. It has no shared code with the mobile app except the API contract (types).
- **supabase/functions/:** Edge functions handle SM-2, streaks, and achievements — logic that must not live on the client (cheating prevention, consistency).

---

## Architectural Patterns

### Pattern 1: Audio Upload Queue (Offline-First)

**What:** Never attempt audio upload synchronously during a session. Write audio to device filesystem, enqueue the URI in the upload store, upload asynchronously when online.

**When to use:** Always — sessions must work on airplane mode. A user in a mosque with no signal cannot have their session fail.

**Trade-offs:** Adds complexity (queue management, retry logic) but is non-negotiable for mobile reliability.

**Example:**
```typescript
// upload.store.ts
interface PendingUpload {
  id: string;
  localUri: string;        // file:// path on device
  ayahRef: string;         // surah:ayah:riwayah
  sessionId: string;
  attempts: number;
  createdAt: number;
}

// recorder.ts - after session ends
const uri = await audioRecorder.stop();
uploadStore.enqueue({ id: uuid(), localUri: uri, ayahRef, sessionId });

// uploader.ts - background process, retries on reconnect
async function drainQueue(queue: PendingUpload[]) {
  for (const item of queue) {
    try {
      await postToInferenceServer(item);
      uploadStore.remove(item.id);
    } catch {
      uploadStore.incrementAttempts(item.id);
    }
  }
}
```

### Pattern 2: Inference Server as Stateless Microservice

**What:** FastAPI server receives audio, runs all 3 models, writes results directly to Supabase via service role key, returns a reference ID. No session state is held in FastAPI.

**When to use:** Always. The FastAPI server must be horizontally scalable and crash-safe. If EC2 instance restarts, no data is lost.

**Trade-offs:** Supabase becomes the single source of truth. FastAPI has no local database — this simplifies the server significantly at the cost of requiring Supabase to be reachable from EC2.

**Example:**
```python
# main.py
@app.post("/analyze")
async def analyze(
    audio: UploadFile,
    ayah_ref: str,
    session_id: str,
    riwayah: str = "hafs",
    x_user_id: str = Header(...)
):
    wav_bytes = await audio.read()
    transcript = asr_model.transcribe(wav_bytes)
    phonemes = phoneme_model.extract(wav_bytes)
    word_times = word_model.align(wav_bytes, transcript)
    violations = tajweed_fsm.evaluate(phonemes)

    result_id = await supabase_client.insert_recitation_result(
        user_id=x_user_id,
        session_id=session_id,
        ayah_ref=ayah_ref,
        riwayah=riwayah,
        transcript=transcript,
        word_timestamps=word_times,
        violations=violations,
    )
    return {"result_id": result_id, "violations": violations}
```

### Pattern 3: Riwayah as First-Class Parameter

**What:** Every function, API endpoint, DB row, and UI component that touches Quran text or audio receives `riwayah` as an explicit typed parameter — never inferred from context.

**When to use:** All layers, always. Retrofitting riwayah into the data model after v1 is prohibitively expensive (requires re-seeding all ayah data, remigrating review schedules, retraining inference expectations).

**Trade-offs:** Slight verbosity everywhere, but eliminates an entire class of bugs when Warsh support ships.

**Example:**
```typescript
// types/quran.ts
type Riwayah = "hafs" | "warsh" | "qalun" | "adDuri";

// Every service function is explicit
async function getAyah(surahNum: number, ayahNum: number, riwayah: Riwayah): Promise<Ayah>
async function recordStrength(ayahId: string, score: number, riwayah: Riwayah): Promise<void>
```

### Pattern 4: Local SM-2 Calculation with Supabase as Ledger

**What:** Calculate the SM-2 next interval locally on device using a pure TypeScript function, then persist the resulting `due_date` and `ease_factor` to both expo-sqlite (for offline access) and Supabase (as the authoritative ledger).

**When to use:** For the review queue. Never call an edge function to compute SM-2 in real-time — latency would break the post-session UX.

**Trade-offs:** SM-2 logic lives in two places (TypeScript + edge function). The edge function version is used for server-side scheduling (push reminders). Keep a single canonical `sm2.ts` file that is shared via reference, not duplicated.

**Example:**
```typescript
// services/hifz/scheduler.ts
export function computeNextReview(card: SM2Card, grade: 0|1|2|3|4|5): SM2Card {
  // Standard Wozniak SM-2 formula
  const ef = Math.max(1.3, card.easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
  const interval = grade < 3 ? 1 : card.interval < 1 ? 1 : card.interval < 6 ? 6 : Math.round(card.interval * ef);
  return { ...card, easeFactor: ef, interval, dueDate: addDays(new Date(), interval) };
}
```

---

## Data Flow

### Recitation Session Flow (Core Loop)

```
User taps "Start Recording"
    │
    ▼
expo-audio begins capture (16kHz mono WAV)
    │
User taps "Stop"
    │
    ▼
RecorderService.stop() → returns localUri (file:// on device)
    │
    ▼
UploadStore.enqueue({ localUri, ayahRef, sessionId, riwayah })
    │
    ▼ (if online, immediately; if offline, deferred)
UploaderService.drain()
    │
    ▼
POST /analyze (multipart/form-data)
    FastAPI receives WAV bytes
        │
        ├── whisper-base-ar → Arabic transcript
        ├── wav2vec2-word   → word timestamps
        └── wav2vec2-phoneme → phoneme sequence
                │
                ▼
        TajweedFSM.evaluate(phonemes) → violations[]
                │
                ▼
        supabase_client.insert_recitation_result() [service role key]
                │
                ▼
        Returns { result_id, violations[] }
    │
    ▼
CorrectorService maps violations → WordError UI objects
    │
    ▼
RecitationResultScreen renders word-by-word highlighting + Tajweed breakdown
    │
    ▼
HifzService.updateAyahStrength(ayahId, score, riwayah)
    │
    ├── SQLite: UPDATE ayah_strength SET ... WHERE riwayah = ?
    └── Supabase: upsert ayah_strength row (sync if online, queue if offline)
    │
    ▼
SchedulerService.computeNextReview(card, grade) → new SM2Card
    │
    ├── SQLite: UPDATE review_schedule SET due_date = ... WHERE riwayah = ?
    └── Supabase Edge Function: calculate-review-schedule (async, non-blocking)
```

### Offline Sync Flow

```
App launches / network reconnects
    │
    ▼
useOfflineSync hook fires
    │
    ├── UploaderService.drain() → flush pending audio uploads
    └── SupabaseSyncService.push() → flush SQLite-only rows to Supabase
            │
            ├── ayah_strength deltas (last_synced_at < updated_at)
            └── review_schedule deltas (last_synced_at < updated_at)
```

### Key Data Flows Summary

1. **Recording → Analysis:** Audio stays on device until upload succeeds. FastAPI is the only component that reads raw WAV. Results written to Supabase by FastAPI (server → server), then read by mobile via Supabase client.
2. **Review Scheduling:** SM-2 computed locally, persisted to SQLite immediately, synced to Supabase async. Review queue is always available offline.
3. **Auth Token Propagation:** Supabase JWT lives in Zustand auth store (persisted via MMKV). Passed as `Authorization: Bearer <jwt>` to Supabase. FastAPI receives `x-user-id` header (extracted from JWT by the mobile app before upload).
4. **Quran Text:** Seeded from quran-json into Supabase at deploy time. Pulled to expo-sqlite on first launch (one-time migration). All ayah reads after that are local-first.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-5k users | Single EC2 g4dn.xlarge for inference; Supabase free/pro tier; no caching needed |
| 5k-50k users | Add inference request queue (Redis + Celery) to prevent GPU overload; consider spot instances behind ALB |
| 50k+ users | Multiple GPU instances behind load balancer; model caching per riwayah; Supabase Pro with read replicas |

### Scaling Priorities

1. **First bottleneck: GPU inference server.** Single T4 GPU processes roughly 2-5 concurrent audio analyses. At ~500+ DAU, requests will queue. Fix: add Celery task queue so FastAPI returns immediately with a `task_id`, mobile polls Supabase for result.
2. **Second bottleneck: Supabase DB write throughput.** Edge functions on streak/achievement updates will pile up at scale. Fix: batch writes, use Postgres functions instead of row-by-row edge function calls.

---

## Anti-Patterns

### Anti-Pattern 1: Service Role Key in Mobile App Bundle

**What people do:** Include the Supabase service role key in the Expo app to bypass RLS for writes.
**Why it's wrong:** The key is trivially extractable from any APK/IPA. Grants full database access to any user.
**Do this instead:** Service role key lives ONLY in FastAPI's environment variables (server-to-server calls). Mobile app uses anon key + RLS only.

### Anti-Pattern 2: Blocking Audio Upload During Session

**What people do:** POST audio to FastAPI synchronously while the user waits on screen for results.
**Why it's wrong:** Mobile network is unreliable. 5-second audio upload on 2G fails. User loses their session data.
**Do this instead:** Queue audio locally, upload async. Show UI immediately with "Analysis pending..." state, update when result arrives via Supabase Realtime or polling.

### Anti-Pattern 3: Storing Riwayah in User Context (Not Per-Record)

**What people do:** Set riwayah once in user settings and implicitly use it everywhere without explicit parameters.
**Why it's wrong:** A user who switches riwayah mid-journey (common for students studying multiple narrations) will corrupt their Hifz data if riwayah is implicit.
**Do this instead:** Every DB row, every API call, every SQLite query carries riwayah as an explicit column/parameter. No inference from context.

### Anti-Pattern 4: Loading Full Quran Into Memory

**What people do:** Load all 6236 ayahs into a JavaScript array on app start for fast access.
**Why it's wrong:** 6MB+ JSON parse on app launch causes jank. Tashkeel-heavy Arabic strings are large. Memory pressure on low-end Android devices.
**Do this instead:** expo-sqlite with indexed queries. Pull only the surah or juz in scope for the current session. Paginate Hifz tracker views.

### Anti-Pattern 5: Performing SM-2 Calculation in Edge Functions Per Session

**What people do:** Send grade to a Supabase edge function, wait for it to compute and return the new interval, then update UI.
**Why it's wrong:** Adds 300-800ms network round trip after every single ayah in a review session. Sessions feel sluggish.
**Do this instead:** Compute SM-2 locally (pure function, no network), update SQLite immediately, sync to Supabase async.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| FastAPI Inference | Mobile → multipart/form-data POST; FastAPI → Supabase service role key writes | FastAPI never exposes Supabase service key to client; mobile only gets result_id |
| Supabase Auth | `@supabase/supabase-js` `signInWithPassword` / `signInWithOAuth` | Apple Sign In requires native module; `expo-auth-session` for Google |
| Supabase Edge Functions | Invoked via `supabase.functions.invoke()` from mobile after session complete | Non-blocking: fire and forget for streak/achievement updates |
| Supabase Realtime | Subscribe to `recitation_results` for the current session_id to receive analysis when ready | Optional: only needed if switching to async inference pattern |
| Push Notifications | Supabase cron edge function → Expo Push Notification Service → device | Cron triggers `send-review-reminder` daily; requires storing Expo push token in DB |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI Layer ↔ Zustand Store | Direct store reads/subscriptions | Never fetch in components — always read from store, let services populate it |
| Service Layer ↔ SQLite | expo-sqlite async API | All SQLite ops are async; use a db.ts singleton initialized once at app start |
| Service Layer ↔ Supabase | `@supabase/supabase-js` REST client | Anon key + JWT; RLS enforced server-side on all user tables |
| Service Layer ↔ FastAPI | Fetch with multipart/form-data | Authenticated via `x-user-id` header (extracted from Supabase JWT) |
| FastAPI ↔ Supabase | Python `supabase` client with service role key | Direct DB writes; bypasses RLS intentionally (server is trusted) |
| expo-sqlite ↔ Supabase | Sync layer in `useOfflineSync` hook | One-directional: device is source of truth for local progress; Supabase is canonical ledger |

---

## Build Order (Phase Dependency Map)

The architecture has clear dependency layers. Build bottom-up:

```
Layer 0 (Foundations — no dependencies):
  ├── Supabase project setup (auth, DB schema, RLS policies, seed quran data)
  ├── FastAPI server skeleton (EC2 provisioned, models loaded, /health endpoint)
  └── Expo project init (Expo Router, TypeScript strict, Supabase client)

Layer 1 (depends on Layer 0):
  ├── expo-sqlite local DB (ayahs seeded from Supabase on first launch)
  ├── Auth flow (Supabase auth ↔ mobile; JWT in Zustand/MMKV)
  └── FastAPI /analyze endpoint (basic audio in → result out, writes to Supabase)

Layer 2 (depends on Layer 1):
  ├── Recitation session (recorder → upload queue → inference → result display)
  ├── Hifz tracker (reads ayah_strength from SQLite, writes back)
  └── Arabic text rendering (RTL, tashkeel, Tajweed color coding)

Layer 3 (depends on Layer 2):
  ├── SM-2 review engine (local calculation + Supabase sync)
  ├── Offline sync (queue drain on reconnect, delta push)
  └── Tajweed violation UI (per-word breakdown, rule explanations)

Layer 4 (depends on Layer 3):
  ├── Dashboard (streak, daily goal, weak spots — all derived from Layer 3 data)
  ├── Profile/analytics (aggregate queries over violation_log, strength data)
  └── Edge functions (streak, achievements, push reminders — polish layer)
```

**Critical path:** Supabase schema → Quran data seed → FastAPI inference endpoint → Audio recording + upload → SM-2 scheduling. Everything else is UI built on top of these primitives.

---

## Sources

- [Expo Local-First Architecture Guide](https://docs.expo.dev/guides/local-first/) — MEDIUM confidence (official, current)
- [Real-time audio processing with Expo](https://expo.dev/blog/real-time-audio-processing-with-expo-and-native-code) — MEDIUM confidence (official Expo blog)
- [expo-audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/) — HIGH confidence (official, current)
- [Using Supabase with Expo React Native](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native) — HIGH confidence (official Supabase docs)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — HIGH confidence (official)
- [Understanding Supabase API Keys](https://supabase.com/docs/guides/api/api-keys) — HIGH confidence (official)
- [Supabase Edge Functions + RLS pattern](https://marmelab.com/blog/2025/12/08/supabase-edge-function-transaction-rls.html) — MEDIUM confidence (third party, recent)
- [FastAPI GPU on EC2 Setup](https://medium.com/@sushanttwayana1/the-complete-guide-to-setting-up-gpu-powered-fastapi-on-aws-ec2-from-zero-to-production-9492a9eabf2f) — MEDIUM confidence (community, aligns with AWS docs)
- [AWS EC2 FastAPI Inferentia Optimization](https://aws.amazon.com/blogs/machine-learning/optimize-aws-inferentia-utilization-with-fastapi-and-pytorch-models-on-amazon-ec2-inf1-inf2-instances/) — HIGH confidence (official AWS)
- [WhisperX Forced Alignment](https://github.com/m-bain/whisperX) — HIGH confidence (official repo, widely used)
- [Offline-First React Native with Supabase + WatermelonDB](https://supabase.com/blog/react-native-offline-first-watermelon-db) — MEDIUM confidence (official Supabase blog)
- [Supastash Sync Engine](https://github.com/0xZekeA/supastash) — LOW confidence (community library, early stage)
- [Expo MMKV + Zustand Offline Pattern](https://medium.com/@nithinpatelmlm/expo-react-native-easy-offline-first-setup-in-expo-using-mmkv-and-zustand-react-native-mmkv-and-68f662c6bc3f) — MEDIUM confidence (community, well-established pattern)
- [Quran Recitation ASR Research (IEEE/arXiv)](https://arxiv.org/pdf/2305.07034) — HIGH confidence (peer-reviewed, relevant baseline)
- [Tarteel AI approach overview](https://tarteel.ai/blog/tarteels-ml-journey-part-1-intro-data-collection/) — MEDIUM confidence (competitor blog, limited technical detail)
- [Clean Architecture Expo + Supabase + Zustand + SQLite (2026)](https://medium.com/@seyhunak/fintech-mobile-architecture-clean-architecture-react-native-expo-supabase-backend-with-zustand-5857fb7a531f) — MEDIUM confidence (community, current)

---

*Architecture research for: Quran Hifz & Recitation AI App (Lawh)*
*Researched: 2026-03-04*

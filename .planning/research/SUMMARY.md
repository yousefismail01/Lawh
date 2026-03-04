# Project Research Summary

**Project:** Lawh — AI-powered Quran Hifz & Recitation Correction Mobile App
**Domain:** Islamic EdTech / AI-assisted memorization & recitation practice
**Researched:** 2026-03-04
**Confidence:** MEDIUM-HIGH (stack HIGH, features HIGH, architecture HIGH, pitfalls HIGH)

## Executive Summary

Lawh is an AI-powered mobile application for Quran memorization (Hifz) and real-time recitation correction. This product type sits at the intersection of Arabic NLP, mobile offline-first architecture, and Islamic education — a domain where no competitor has yet combined named Tajweed rule detection, per-ayah spaced repetition, and multi-riwayah architectural support in a single product. The recommended approach is a React Native / Expo managed-workflow mobile app backed by Supabase for persistence and auth, with a separate GPU-accelerated FastAPI inference microservice on EC2 for the three ML models (Whisper ASR, wav2vec2 phoneme extraction, wav2vec2 word alignment). The AI pipeline runs three models over each audio submission to produce word-level mistake detection, Tajweed rule classification via a Finite State Machine, and word-boundary timestamps — all three together constitute the core product moat.

The key architectural principle is offline-first throughout: Quran text is seeded into expo-sqlite on first launch and never requires a network connection; audio recordings are queued locally and uploaded asynchronously; SM-2 spaced repetition intervals are computed on-device and synced to Supabase as a canonical ledger. This design supports the primary use-case context — users reciting in a masjid without reliable connectivity. Multi-riwayah support (Hafs, Warsh, Qalun, Ad-Duri) must be baked into the database schema and API contracts from day one as a compound primary key on the `ayahs` table; retrofitting this later is a full-stack rewrite touching every table, query, and API endpoint.

The two highest-severity risks are Arabic Unicode normalization mismatches (which cause every word to be flagged as wrong silently) and Supabase RLS misconfiguration (a known pattern that exposed 170+ apps in 2025). Both must be addressed in the foundation phase before any AI integration work begins. A secondary risk is the Tajweed FSM false positive rate — specialist NeurIPS 2025 research confirms that Tajweed detection models achieve only ~57% generalization accuracy, meaning confidence thresholding (0.85+) before surfacing violations to users is non-negotiable for preserving trust in the core feedback loop.

---

## Key Findings

### Recommended Stack

The mobile layer is Expo SDK 55 (React Native 0.83, New Architecture only, Hermes v1) with Expo Router for file-based navigation and deep linking, TypeScript strict mode throughout, Zustand for client-side UI state, and TanStack Query for server-state caching lifecycles. Local persistence uses expo-sqlite v15 with drizzle-orm for type-safe queries and `useLiveQuery` reactive updates. Audio recording uses `@mykin-ai/expo-audio-stream` — not `expo-av` — because only this library guarantees 16kHz mono WAV output on both iOS and Android, which is a hard requirement for Whisper-based ASR accuracy.

The backend is a clean split: Supabase handles auth (Supabase Auth + Apple/Google OAuth), the relational database (PostgreSQL with full RLS), Edge Functions (SM-2 scheduling, streaks, achievements, push notification cron), and optionally Storage for audio persistence. FastAPI on EC2 g4dn.xlarge (NVIDIA T4 GPU) handles all ML inference — three models loaded simultaneously using faster-whisper with `compute_type="int8_float16"` to fit all three in 16GB VRAM. This split is absolute: Supabase has no GPU access; FastAPI holds no user session state.

**Core technologies:**
- Expo SDK 55 + Expo Router 55: managed-workflow mobile framework with file-based navigation and automatic deep linking
- TypeScript 5.x strict: non-negotiable for complex domain types (ayah refs, riwayah enums, SM-2 structs, Tajweed rules)
- Supabase (auth, Postgres, Edge Functions, Storage, Realtime): single backend service covering all non-GPU concerns
- FastAPI + faster-whisper + transformers on EC2 g4dn.xlarge: Python ML ecosystem on T4 GPU for all three ASR/phoneme models
- expo-sqlite + drizzle-orm: offline-first local database with reactive queries and type-safe ORM
- Zustand + TanStack Query: cleanly separated client state (Zustand) and server state (TanStack Query)
- @mykin-ai/expo-audio-stream: purpose-built 16kHz mono WAV recorder for ASR pipelines — expo-av cannot replace this
- React Native Skia (@shopify/react-native-skia): per-character Tajweed color overlays in drill mode only

### Expected Features

Research confirms no competitor combines all three of Lawh's differentiators. Tarteel has word-level detection but no Tajweed rule classification and no SM-2. TajweedMate has limited rule detection but no AI and no Hifz tracking. El-Mohafez has multi-riwayah text support but no AI recitation correction.

**Must have (table stakes — v1 launch):**
- Full Quran text with tashkeel (diacritics), RTL Arabic rendering with KFGQPC/Amiri font
- Audio playback with multiple reciters (Sheikh Hudhaify + Al-Husary minimum)
- Surah/Juz navigation, basic search by Surah name and ayah number
- User authentication (email/password + Apple Sign In + Google Sign In)
- Offline Quran text access (expo-sqlite pre-seeded on first launch)
- Word-level mistake detection (Tarteel established this as the baseline expectation)
- Audio recording pipeline (16kHz mono WAV via @mykin-ai/expo-audio-stream)
- Memorization progress tracking per Surah with color-coded strength views
- Daily streak counter + dashboard with daily goal
- Push notification review reminders (critical for day 1-7 retention)
- Row Level Security on all user tables before any real users

**Should have (competitive differentiators — v1 or v1.x):**
- Tajweed rule violation classification (13+ named rules, FSM over phoneme sequences) — the primary product moat; no competitor does this in real-time
- Per-ayah strength scoring with SM-2 spaced repetition — algorithmically superior to every competitor's binary "memorized/not" tracking
- Review queue with urgency sorting — removes decision fatigue for Hifz students
- Session modes: new memorization + review (the two core practice workflows)
- Hifz tracker: Surah Grid view with per-ayah strength color-coding
- Bilingual Tajweed rule explanations (Arabic rule name + English translation)
- Core gamification: streak counter + 5 milestone achievements
- Word-boundary highlight during recitation (real-time visual alignment)
- Tajweed weakness analytics chart (per-rule violation trends over time)
- Juz View and Page View in Hifz tracker
- Offline AI queueing (record offline, process when reconnected)

**Defer (v2+):**
- Warsh / Qalun / Ad-Duri ASR models — architecture ships multi-riwayah ready; models deferred until available
- Teacher-student accountability mode — separate permission model; validate solo use first
- Web app — mobile product-market fit first
- Family plan / multiple profiles — adds auth complexity; defer until retention is proven
- Social feed, leaderboards, teacher marketplace, real-time chat — explicitly anti-features for this domain (privacy, focus, moderation burden)

### Architecture Approach

The architecture follows a layered dependency model with a clear critical path: Supabase schema with multi-riwayah PKs → Quran data seed with normalization → FastAPI inference endpoint → audio recording + upload queue → SM-2 scheduling. The mobile client is offline-first throughout: local expo-sqlite is the primary read source for all Quran text and user progress; Supabase is the canonical write ledger that mirrors device state. FastAPI is a fully stateless microservice — it receives audio, runs all three models, writes results directly to Supabase via service role key (server-to-server, never via the mobile client), and returns a result reference ID. The SM-2 algorithm runs as a pure TypeScript function on-device for zero-latency post-session scoring, then syncs to Supabase asynchronously.

**Major components:**
1. Expo Mobile Client (UI + Zustand stores + Service Layer) — screens, navigation, offline logic, upload queue
2. expo-sqlite Local DB — offline Quran text cache, progress, SM-2 schedules; syncs to Supabase on reconnect
3. Supabase (Auth + PostgreSQL + Edge Functions + Storage) — auth, canonical data ledger, SM-2/streak/achievement/push cron logic
4. FastAPI Inference Server (EC2 g4dn.xlarge, NVIDIA T4) — stateless microservice running Whisper ASR + wav2vec2 phoneme + wav2vec2 word alignment + Tajweed FSM
5. Tajweed FSM (inside FastAPI) — finite state machine over phoneme sequences to detect 13+ named rule violations

**Key patterns:**
- Audio Upload Queue (offline-first): audio never uploaded synchronously; always queued to device storage, drained async on reconnect
- Riwayah as First-Class Parameter: every function, query, API call, and DB row carries `riwayah` as explicit typed parameter — never inferred
- Local SM-2 + Supabase Ledger: SM-2 computation is on-device (zero latency), Supabase is the async sync target
- Inference Server as Stateless Microservice: FastAPI holds no session state; writes directly to Supabase; crash-safe by design
- Service role key isolation: service key exists only in EC2 environment variables; mobile app uses anon key + RLS only

### Critical Pitfalls

1. **Arabic Unicode normalization mismatch** — Store pre-computed `normalized_text` alongside full tashkeel `text` in the `ayahs` table; apply a custom normalization pipeline (strip tashkeel → normalize hamza variants → normalize alef variants → NFC) on all strings before any comparison; never use JS `normalize('NFC')` alone. Must be solved in the foundation phase before any AI inference integration.

2. **Supabase RLS incomplete or missing on new tables** — Enable RLS on every table in the initial migration (deny-all default); add a CI check that alerts on any new table without RLS; write integration tests that verify access behavior with real JWT tokens (never test in the SQL Editor, which bypasses RLS). High-risk tables: `review_schedule`, `tajweed_violation_log`, `hifz_progress`, `session_events`, `achievements`.

3. **Service role key leakage via FastAPI trust boundary** — FastAPI must validate the Supabase JWT on every request; `user_id` must always be extracted from verified JWT claims, never from the request body; service role key lives only in EC2 environment variables; restrict EC2 security group to disallow 0.0.0.0/0 on the FastAPI port.

4. **Audio pipeline producing wrong format for ASR** — Use `@mykin-ai/expo-audio-stream` (not expo-av) for guaranteed 16kHz mono WAV output; add server-side audio format validation in FastAPI (assert sample rate, channels, encoding) and return 422 on bad audio; validate with `ffprobe` on physical devices (not simulators) before any AI integration work.

5. **Multi-riwayah not in schema from day one** — The `ayahs` table primary key must be `(surah_number, ayah_number, riwayah)` from the initial migration; every API endpoint and Edge Function must accept `riwayah` as an explicit parameter; retrofitting this post-launch is assessed as a full-stack rewrite (VERY HIGH recovery cost).

6. **Tajweed FSM false positive rate destroying user trust** — Apply confidence threshold (0.85+) before surfacing any violation to the user; prioritize high-precision rules first; present Tajweed feedback as "suggestions" in early phases; do not ship Tajweed feedback to users until false positive rate is validated below 15% on a held-out set of correct recitations from expert reciters.

7. **SM-2 ease hell trapping users in infinite low-interval loops** — Implement SM-2+ modifications from the start: proportional credit for overdue items, ease factor recovery after 3 consecutive correct answers, ±10% interval jitter, daily review queue cap with urgency sort. Retrofitting SM-2+ into deployed SM-2 requires recalculating all user intervals.

---

## Implications for Roadmap

Based on the build order dependency map from ARCHITECTURE.md and the pitfall-to-phase mapping from PITFALLS.md, the following phase structure is recommended:

### Phase 1: Foundation — Schema, Data, Auth, and Project Setup
**Rationale:** Everything else depends on the Quran data being correctly seeded, the schema being multi-riwayah correct, RLS being enabled, and auth working. Arabic Unicode normalization and multi-riwayah schema are the two highest-recovery-cost pitfalls — both must be solved here, not retrofitted. There is zero value in building AI features on a broken text foundation.
**Delivers:** Expo project initialized (Router, TypeScript strict, Supabase client), Supabase project with full schema + RLS on all tables, Quran data seeded with pre-computed `normalized_text` column, auth flow (email + Apple + Google), expo-sqlite seeded from Supabase on first launch, FastAPI skeleton on EC2 with /health endpoint.
**Addresses:** Full Quran text with tashkeel, RTL Arabic rendering, user authentication, offline Quran text access, Surah/Juz navigation
**Avoids:** Arabic Unicode normalization mismatch (Pitfall 1), multi-riwayah schema omission (Pitfall 5), RLS misconfiguration (Pitfall 2)
**Research flag:** Standard patterns — Supabase schema, Expo Router init, and RTL text rendering are well-documented. No phase research needed.

### Phase 2: Audio Pipeline and Core AI Inference
**Rationale:** The audio recording pipeline is the prerequisite for all AI features and must be validated before any AI integration work begins. Audio format correctness (16kHz mono WAV on both platforms) must be verified with physical device tests before FastAPI inference is wired up — silent accuracy degradation from wrong audio format is the hardest bug to diagnose post-integration.
**Delivers:** @mykin-ai/expo-audio-stream integration producing validated 16kHz mono WAV, FastAPI /analyze endpoint with JWT validation, all three ML models loaded on GPU (Whisper ASR + wav2vec2 phoneme + wav2vec2 word alignment), audio upload queue (PendingUpload store, async drain on reconnect), audio session interruption handling on iOS.
**Uses:** @mykin-ai/expo-audio-stream, FastAPI + faster-whisper + transformers, EC2 g4dn.xlarge, Supabase service role write-back
**Addresses:** Audio recording pipeline, word-level mistake detection
**Avoids:** Audio format mismatch (Pitfall 4), audio session interruption data loss (Pitfall 8), service role key leakage (Pitfall 3)
**Research flag:** Needs research-phase during planning — GPU EC2 deployment, model loading, and CUDA environment setup have niche configuration details. Also validate @mykin-ai/expo-audio-stream has an SDK 55 compatible release before this phase begins.

### Phase 3: Tajweed FSM and Recitation Session Loop
**Rationale:** The Tajweed Finite State Machine is the core product moat and the highest-complexity AI component. It must be built after the audio pipeline is validated and stable. The FSM should not be shipped to users until its false positive rate is validated on expert recitations — building the confidence-threshold layer and the post-session UI before enabling user-facing flags is the correct order.
**Delivers:** Tajweed FSM (13+ rules, Python, phoneme sequence → violations), word-level mistake detection diff against expected text, recitation result screen (word-by-word highlighting + Tajweed breakdown with bilingual rule explanations), confidence threshold layer (0.85+) before surfacing violations, tajweed_violation_log table with per-rule logging.
**Addresses:** Tajweed rule classification, bilingual Tajweed explanations, word-level mistake detection (full implementation)
**Avoids:** Tajweed false positive rate (Pitfall 7) — validate on expert reciter test set before user-facing release
**Research flag:** Needs research-phase during planning — Tajweed FSM phoneme state definitions for all 13+ rules require domain-specific Islamic scholarship validation in addition to technical implementation. Low false-positive rate is not guaranteed without expert review of rule definitions.

### Phase 4: Hifz Tracker and SM-2 Review Engine
**Rationale:** The SM-2 review engine depends on correct AI recitation results (Phase 3 output) as input for ease factor calculation. The Hifz tracker is the primary daily engagement surface and must be built after both the data model (Phase 1) and the AI scoring signal (Phase 3) are in place. SM-2+ modifications must be built from the start — retrofitting requires recalculating all user intervals.
**Delivers:** Per-ayah strength scoring (SM-2+ with proportional overdue credit, ease recovery, interval jitter), review queue with urgency sorting (SM-2 due date + ayah order), Hifz tracker Surah Grid view with per-ayah color-coded strength, session modes (new memorization + review), calculate-review-schedule Edge Function, local SM-2 TypeScript implementation (for offline, zero-latency scoring).
**Addresses:** Per-ayah SM-2 strength scoring, review queue, Hifz tracker (Surah Grid), session modes
**Avoids:** SM-2 ease hell (Pitfall 6) — implement SM-2+ modifications from the start, not standard SM-2
**Research flag:** Standard patterns — SM-2 algorithm is well-documented. SM-2+ modifications have clear reference implementations (BlueRaja). No phase research needed beyond confirming domain-specific parameters.

### Phase 5: Offline Sync, Dashboard, Gamification, and Retention
**Rationale:** Offline sync can only be designed correctly after the core tables (hifz_progress, review_schedule, session_events) are stable. The dashboard, streak, and achievement features are derived data — they require the tracking primitives from Phases 1-4 to exist first. Retention mechanics (push notifications, streaks, achievements) are highest-impact for week 1-7 churn and must ship with or before the v1 launch.
**Delivers:** Offline sync with conflict resolution (last-modified-at comparison, upsert not delete-insert), useOfflineSync hook (audio upload drain + SQLite delta push), dashboard (streak counter, daily goal progress, weak spots summary), daily streak (update-streak Edge Function with timezone-correct midnight rollover), core gamification (5 achievements + unlock-achievements Edge Function), push notification reminders (send-review-reminder cron Edge Function), activity heatmap.
**Addresses:** Progress persistence and sync, daily streak, push notification reminders, offline access, gamification
**Avoids:** Offline sync conflicts corrupting Hifz data (Pitfall 9), streak timezone errors (UX Pitfall)
**Research flag:** Standard patterns — Supabase Realtime sync and expo-sqlite upsert patterns are well-documented. Timezone-aware streak logic is straightforward. No phase research needed.

### Phase 6: Polish, Analytics, and Extended Features
**Rationale:** Power user features (Tajweed weakness analytics, Juz/Page views, voice search, word-boundary highlights, offline AI queueing) require a stable core product with real user data to validate. Tajweed analytics requires accumulated violation_log data. Word-boundary real-time highlighting requires the audio pipeline to be stable and performant first.
**Delivers:** Tajweed weakness analytics chart (per-rule violation trends), word-boundary highlight during recitation (real-time visual alignment via wav2vec2-word model), Juz View and Page View in Hifz tracker, voice search ("Shazam for Quran" via ASR reuse), free recitation and Tajweed drill session modes, offline AI queueing (expo-sqlite upload queue with retry), per-juz strength on profile, extended achievement set (10+), monthly review calendar heatmap.
**Addresses:** v1.x and selected v2 features from FEATURES.md priority matrix
**Research flag:** Word-boundary highlight (real-time alignment UX) may benefit from research-phase to validate latency characteristics on device before implementation.

### Phase Ordering Rationale

- Foundation must precede everything: Arabic text normalization and multi-riwayah schema are foundation-phase concerns with VERY HIGH retrofit cost if missed.
- Audio pipeline before AI integration: silent ASR accuracy degradation from wrong audio format is impossible to debug post-integration; validate format first.
- AI pipeline (Phase 2) before Tajweed FSM (Phase 3): the FSM runs on top of the phoneme model output; the phoneme pipeline must be stable first.
- AI scoring (Phase 3) before SM-2 engine (Phase 4): the ease factor signal that drives SM-2 comes from AI recitation results; Phase 4 depends on Phase 3 outputs.
- Core loop (Phases 1-4) before retention mechanics (Phase 5): the streak and gamification surface must have real Hifz data to display.
- Polish features (Phase 6) last: these all require accumulated data or a stable core product to build on.

### Research Flags

Phases likely needing `/gsd:research-phase` during planning:
- **Phase 2 (Audio Pipeline + AI Inference):** GPU EC2 deployment, model concurrent loading in 16GB VRAM, CUDA 12.1 environment setup, and the @mykin-ai/expo-audio-stream SDK 55 compatibility have niche details. FastAPI JWT validation middleware pattern with Supabase tokens also benefits from a dedicated research pass.
- **Phase 3 (Tajweed FSM):** The 13+ Tajweed rule definitions in terms of phoneme state transitions require both technical (wav2vec2 phoneme label mappings) and Islamic scholarship validation. This is sparse territory — no open-source reference FSM exists for this. Warrants research-phase before implementation begins.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Supabase schema, Expo Router project init, RLS policies, and quran-json data seeding are all well-documented with official examples.
- **Phase 4 (SM-2 Engine):** SM-2 and SM-2+ are thoroughly documented with reference implementations. Supabase Edge Functions for scheduling are standard patterns.
- **Phase 5 (Offline Sync + Retention):** expo-sqlite upsert sync, Supabase Realtime, push notification cron patterns are all official-docs territory.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core mobile stack (Expo SDK 55, Supabase, expo-sqlite, drizzle-orm) confirmed from official documentation. FastAPI + faster-whisper patterns confirmed from official repos and PyPI. @mykin-ai/expo-audio-stream is a community library — pin to tested version and verify SDK 55 release before upgrading Expo. |
| Features | HIGH | Market landscape cross-verified across multiple sources. Competitor feature matrix confirmed via App Store listings and product analyses. SM-2 gap in competitors confirmed from Tarteel's own blog. Tajweed detection accuracy ceiling confirmed from NeurIPS 2025 research. |
| Architecture | HIGH | Build order and component boundaries drawn from official Expo, Supabase, and FastAPI documentation. Three-model GPU inference pattern is standard ML microservice architecture. Offline-first sync conflict resolution strategies are well-established. |
| Pitfalls | HIGH (Arabic/RLS/Security), MEDIUM (Tajweed FSM internals, word alignment) | Arabic Unicode normalization and RLS pitfalls are confirmed from real-world incidents (2025 Supabase breach report, UTR#53). Audio format issues confirmed from Whisper GitHub discussions and React Native audio pipeline post-mortems. Tajweed FSM accuracy ceiling confirmed from NeurIPS 2025 academic research. Word alignment internal behavior is sparse — limited public post-mortems. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Tajweed FSM phoneme label mappings for wav2vec2-quran-phonetics model**: The specific phoneme label set output by `TBOGamer22/wav2vec2-quran-phonetics` is not confirmed from public documentation. The FSM rule definitions depend on knowing exactly which phoneme tokens the model produces. This must be resolved at Phase 3 research time by loading the model and inspecting its label vocabulary.
- **@mykin-ai/expo-audio-stream SDK 55 compatibility**: This is a community library. Verify it has released an SDK 55 compatible version before committing to it in Phase 2. If unavailable, evaluate whether server-side resampling in FastAPI (librosa.resample) can compensate for expo-av's format limitations as a fallback.
- **Tajweed FSM rule coverage confirmation**: The 13+ Tajweed rules to be detected need explicit enumeration and Islamic scholarship review. Research confirmed the technical approach (phoneme FSM) but the rule completeness and correct phoneme mappings per rule are domain-specific and cannot be sourced from general ML literature.
- **EC2 g4dn.xlarge VRAM budget validation**: Three models loaded simultaneously with int8 quantization on a 16GB T4 GPU. The int8 VRAM budget calculation should be empirically validated before Phase 2 begins — model sizes can shift between versions and quantization configs.
- **quran-json dataset riwayah coverage**: The research assumes quran-json contains Hafs text only. Warsh and other riwayah text sources need to be identified for the multi-riwayah architecture to be seeded with real data when ASR models become available.

---

## Sources

### Primary (HIGH confidence)
- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) — SDK 55 / React Native 0.83, New Architecture only, Hermes v1
- [Supabase Expo React Native Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native) — required polyfills and auth adapter pattern
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS policy patterns and performance
- [faster-whisper PyPI](https://pypi.org/project/faster-whisper/) — v1.2.1 stable, int8_float16 compute_type
- [SYSTRAN/faster-whisper GitHub](https://github.com/SYSTRAN/faster-whisper) — 4-6x speed improvement over vanilla Whisper
- [Drizzle ORM Expo SQLite Docs](https://orm.drizzle.team/docs/connect-expo-sqlite) — useLiveQuery, expo driver, migration bundling
- [FastAPI Server Workers Docs](https://fastapi.tiangolo.com/deployment/server-workers/) — Gunicorn + UvicornWorker production pattern
- [Hugging Face Transformers Docs](https://huggingface.co/docs/transformers/model_doc/whisper) — pipeline API, device_map, torch_dtype
- [expo-audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/) — audio recording API
- [Unicode Arabic Mark Rendering (UTR #53)](https://www.unicode.org/reports/tr53/) — authoritative on NFC/NFD insufficiency for Arabic diacritics
- [Supabase RLS Security Flaw — byteiota 2025](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/) — 170+ app incident report
- [AWS EC2 FastAPI Inferentia Optimization](https://aws.amazon.com/blogs/machine-learning/optimize-aws-inferentia-utilization-with-fastapi-and-pytorch-models-on-amazon-ec2-inf1-inf2-instances/) — GPU EC2 FastAPI pattern
- [Apple Developer: Handling Audio Interruptions](https://developer.apple.com/documentation/avfaudio/handling-audio-interruptions) — iOS AVAudioSession interruption behavior
- [TajweedAI: Hybrid ASR-Classifier — NeurIPS 2025](https://neurips.cc/virtual/2025/133028) — 57% generalization accuracy on Tajweed detection

### Secondary (MEDIUM confidence)
- [mykin-ai/expo-audio-stream GitHub](https://github.com/mykin-ai/expo-audio-stream) — 16kHz dual-stream output, ASR pipeline design
- [tarteel-ai/whisper-base-ar-quran Hugging Face](https://huggingface.co/tarteel-ai/whisper-base-ar-quran) — 5.75% WER model card
- [Tarteel AI App Store listing + Skywork analysis](https://apps.apple.com/us/app/tarteel-ai-quran-memorization/id1391009396) — competitor feature verification
- [Tarteel blog: Spaced Repetition](https://tarteel.ai/blog/spaced-repetition-and-quran-memorization-how-to-make-your-hifz-stick-for-life/) — confirms Tarteel does not implement algorithmic SM-2
- [A Better Spaced Repetition Algorithm: SM2+ — BlueRaja](https://www.blueraja.com/blog/477/a-better-spaced-repetition-learning-algorithm-sm2+) — SM-2+ modifications for ease hell prevention
- [Expo Router v55 Blog](https://expo.dev/blog/expo-router-v55-more-native-navigation-more-powerful-web) — expo-router version alignment
- [Offline-First React Native with Supabase — Supabase Blog](https://supabase.com/blog/react-native-offline-first-watermelon-db) — sync architecture patterns
- [Clean Architecture Expo + Supabase + Zustand + SQLite 2026](https://medium.com/@seyhunak/fintech-mobile-architecture-clean-architecture-react-native-expo-supabase-backend-with-zustand-5857fb7a531f) — community production pattern
- [Quran Recitation ASR Research — arXiv 2305.07034](https://arxiv.org/pdf/2305.07034) — academic baseline on detection accuracy
- [Optimal Sample Rate for Whisper — GitHub Discussion](https://github.com/openai/whisper/discussions/870) — Whisper sample rate behavior

### Tertiary (LOW confidence)
- [Supastash Sync Engine](https://github.com/0xZekeA/supastash) — community early-stage offline sync library (not recommended for use, noted for awareness)
- [Quran Hifz Revision — Google Play SM-2 app](https://play.google.com/store/apps/details?id=com.github.ahmad_hossain.quranspacedrepetition) — confirms SM-2 exists in the Quran space but is rare

---
*Research completed: 2026-03-04*
*Ready for roadmap: yes*

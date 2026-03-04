# Roadmap: Lawh

## Overview

Lawh ships in five phases ordered by dependency and risk. Phase 1 bakes the architectural non-negotiables (multi-riwayah schema, Arabic normalization, RLS, auth) before any AI work begins — the two highest recovery-cost pitfalls both live here. Phase 2 validates the audio pipeline and wires up the core AI inference loop; format correctness must be proven on physical devices before the Tajweed FSM is built on top of it. Phase 3 delivers the primary product moat: Tajweed rule classification and the complete recitation session UI. Phase 4 closes the Hifz loop with per-ayah SM-2 scoring, the review queue, and session modes. Phase 5 adds the retention surface — dashboard, streaks, achievements, and push notifications — which require real tracked data from Phases 1-4 to populate.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Schema, Quran data, auth, RTL rendering, and offline text cache
- [ ] **Phase 2: Audio Pipeline and Core AI** - 16kHz recording, FastAPI inference, word-level mistake detection
- [ ] **Phase 3: Tajweed FSM and Session UI** - 13+ rule classification, confidence gating, recitation session loop
- [ ] **Phase 4: Hifz Tracker and SM-2 Engine** - Per-ayah strength scoring, review queue, session modes
- [ ] **Phase 5: Dashboard, Gamification, and Retention** - Streaks, achievements, push notifications, activity dashboard

## Phase Details

### Phase 1: Foundation
**Goal**: The app has a correct, secure, multi-riwayah-ready base that all subsequent features can build on without retrofitting
**Depends on**: Nothing (first phase)
**Requirements**: FNDN-01, FNDN-02, FNDN-03, FNDN-04, FNDN-05, FNDN-06, FNDN-07, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, RIWY-01
**Success Criteria** (what must be TRUE):
  1. User can open the app, see the full Quran (6,236 ayahs) with correct Arabic tashkeel and RTL layout on both iOS and Android — no network required after first launch
  2. User can navigate to any surah or juz by Arabic name, transliteration, or number and see per-ayah text with juz/hizb/rub markers
  3. User can create an account with email/password, sign in with Apple, or sign in with Google — session survives app restart
  4. Every user-facing database table enforces Row Level Security; a logged-in user cannot read or write another user's data
  5. Every database query, API endpoint, and Edge Function accepts riwayah as an explicit typed parameter; the ayahs table has a (surah_number, ayah_number, riwayah) composite primary key
**Plans**: 7 plans

Plans:
- [ ] 01-01-PLAN.md — TypeScript type contracts + Supabase migrations (10 tables, RLS, auth trigger)
- [ ] 01-02-PLAN.md — Expo project scaffold, dependencies, Supabase client, Zustand stores, 5-tab routing
- [x] 01-03-PLAN.md — Arabic normalization pipeline + Drizzle SQLite schema + Supabase seed script
- [ ] 01-04-PLAN.md — Auth flows: email/password, Apple Sign In, Google Sign In + session persistence
- [ ] 01-05-PLAN.md — SQLite offline cache: first-launch seed, quranService, useQuranData hook
- [ ] 01-06-PLAN.md — Quran display components (AyahText RTL, SurahHeader, AyahCard) + surah list + navigation
- [ ] 01-07-PLAN.md — FastAPI skeleton on EC2: /health endpoint, Riwayah enum, Docker, nginx HTTPS

### Phase 2: Audio Pipeline and Core AI
**Goal**: A user can record a recitation and receive word-level correctness feedback from the AI inference server
**Depends on**: Phase 1
**Requirements**: AUDP-01, AUDP-02, AUDP-03, AUDP-04, AIRC-01, AIRC-02, AIRC-03, AIRC-04, AIRC-05, AIRC-06, AIRC-07, AIRC-08, RIWY-03
**Success Criteria** (what must be TRUE):
  1. User can record a recitation on both iOS and Android and the server receives a validated 16kHz mono WAV file; invalid format submissions are rejected with a 422 error
  2. After recording, the app shows which words were correct (green), wrong (red), or skipped/added — with an overall accuracy score — within a user-perceptible response time
  3. Recordings made with no internet connection queue locally and upload automatically when the connection restores; no audio data is lost on interruption (including phone calls on iOS)
  4. The FastAPI server validates the user's Supabase JWT on every request; user_id is extracted from verified claims only, never from the request body
**Plans**: TBD

### Phase 3: Tajweed FSM and Session UI
**Goal**: The app surfaces named Tajweed rule violations with bilingual explanations alongside word-level feedback, and the full recitation session UI is complete
**Depends on**: Phase 2
**Requirements**: TAJW-01, TAJW-02, TAJW-03, TAJW-04, TAJW-05, TAJW-06, SESS-03, SESS-04, SESS-05, SESS-06
**Success Criteria** (what must be TRUE):
  1. After reciting, the user sees Tajweed violations annotated on the Quran text with color coding (13 categories) alongside each rule's Arabic name, English name, severity (minor/major), and bilingual explanation
  2. Only violations that exceed the 0.85 confidence threshold are shown to the user; below-threshold detections are logged but not surfaced
  3. During an active session, the user sees the mushaf Arabic text with an animated waveform, can hold a Peek button to reveal hidden text, and receives word-level color highlights (green/red/orange) immediately after AI analysis completes
  4. The post-session summary shows accuracy percentage, ayahs covered, time elapsed, mistake breakdown by type, and strength score changes
**Plans**: TBD

### Phase 4: Hifz Tracker and SM-2 Engine
**Goal**: Users can track memorization per-ayah with AI-driven strength scores, see what needs review, and run structured memorization and review sessions
**Depends on**: Phase 3
**Requirements**: HIFZ-01, HIFZ-02, HIFZ-03, HIFZ-04, HIFZ-05, SM2-01, SM2-02, SM2-03, SM2-04, SM2-05, REVW-01, REVW-02, REVW-03, SESS-01, SESS-02
**Success Criteria** (what must be TRUE):
  1. User can open the Hifz tracker and see all 114 surahs color-coded by status (not started / in progress / memorized / needs review); tapping any surah shows per-ayah strength bars (0-100%) with last reviewed date and next review due
  2. User sees a review queue sorted by urgency (most overdue first) and can start a review session directly from it; after each ayah in the session the AI grades the recitation, SM-2+ updates the interval, and the new next-review date is shown
  3. After completing a session, the per-ayah strength scores and review dates update correctly in both the local SQLite store and Supabase — overdue items, ease factor recovery, and interval jitter behave per the SM-2+ spec
  4. User can start a New Memorization session for unmemorized ayahs and a Review session from the queue; both modes display the session UI built in Phase 3
**Plans**: TBD

### Phase 5: Dashboard, Gamification, and Retention
**Goal**: Users have a home dashboard showing daily progress and weak spots, earn streaks and achievements, and receive push notification reminders — completing the retention loop
**Depends on**: Phase 4
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, GAME-01, GAME-02, GAME-03, GAME-04, RIWY-02
**Success Criteria** (what must be TRUE):
  1. The dashboard shows a daily goal progress ring, streak counter (current and longest), a review due badge (tappable to start review), a "continue where you left off" card, a weak spots widget with the 3 lowest-strength ayahs, and a 12-week activity heatmap — all populated from real session data
  2. User earns and sees the 5 core achievements (first_ayah, juz_amma, streak_7, streak_30, perfect_session) when criteria are met; the unlock-achievements Edge Function runs after each session
  3. User receives a push notification reminder when reviews are due and when a streak is at risk; the send-review-reminder cron Edge Function fires on schedule
  4. User can select their riwayah in profile settings (Hafs available; Warsh/Qalun/Ad-Duri shown as "Coming Soon"); changing the setting propagates to all subsequent sessions and queries
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/7 | In Progress|  |
| 2. Audio Pipeline and Core AI | 0/TBD | Not started | - |
| 3. Tajweed FSM and Session UI | 0/TBD | Not started | - |
| 4. Hifz Tracker and SM-2 Engine | 0/TBD | Not started | - |
| 5. Dashboard, Gamification, and Retention | 0/TBD | Not started | - |

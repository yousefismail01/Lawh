# Requirements: Lawh

**Defined:** 2026-03-04
**Core Value:** AI-powered recitation correction with word-level accuracy and Tajweed rule detection — the one capability that transforms passive memorization into active, feedback-driven learning.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [x] **FNDN-01**: App initializes with full Quran text (6,236 ayahs) with complete tashkeel in Supabase, seeded from quran-json dataset
- [x] **FNDN-02**: Every ayah record includes riwayah field with multi-riwayah composite unique key (surah_id, ayah_number, riwayah)
- [x] **FNDN-03**: Quran text is pre-cached in expo-sqlite on first launch for offline access
- [x] **FNDN-04**: Arabic text renders correctly RTL with full tashkeel using KFGQPC Uthmanic Hafs or Amiri Quran font on both iOS and Android
- [x] **FNDN-05**: Pre-computed normalized_text column stored alongside display text for comparison operations
- [x] **FNDN-06**: Supabase schema includes all 10 tables with Row Level Security enabled and policies enforced on every user-facing table
- [x] **FNDN-07**: Surah/Juz navigation with Arabic names, transliteration, and juz/hizb/rub markers

### Authentication

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User can sign in with Apple Sign In
- [x] **AUTH-03**: User can sign in with Google Sign In
- [x] **AUTH-04**: User session persists across app restarts via AsyncStorage
- [x] **AUTH-05**: User profile created automatically on signup with default riwayah (Hafs) and daily goals

### Audio Pipeline

- [ ] **AUDP-01**: User can record recitation audio producing 16kHz mono WAV on both iOS and Android
- [ ] **AUDP-02**: Audio recordings queue locally when offline and upload automatically on reconnect
- [ ] **AUDP-03**: iOS audio session interruptions (phone calls) are handled gracefully without data loss
- [ ] **AUDP-04**: FastAPI server validates audio format (sample rate, channels, encoding) and rejects invalid submissions with 422

### AI Recitation Correction

- [ ] **AIRC-01**: FastAPI inference server runs Whisper ASR (tarteel-ai/whisper-base-ar-quran) producing word-level transcription
- [ ] **AIRC-02**: Word-level diff compares transcription against expected ayah text with Arabic-specific normalization (hamza, alef, ta marbuta, alef maqsura variants)
- [ ] **AIRC-03**: Each word is classified as correct, wrong, skipped, or added with position tracking
- [ ] **AIRC-04**: Tashkeel errors flagged separately (correct base word, wrong diacritics)
- [ ] **AIRC-05**: Overall recitation score calculated (weighted: word accuracy 70%, tajweed 30%)
- [ ] **AIRC-06**: All inference results written to Supabase via service role key (server-to-server only)
- [ ] **AIRC-07**: FastAPI validates Supabase JWT on every request and extracts user_id from verified claims
- [ ] **AIRC-08**: All three ML models run with int8 quantization on NVIDIA T4 GPU simultaneously

### Tajweed Detection

- [ ] **TAJW-01**: Phonetic ASR model (wav2vec2-quran-phonetics) produces phoneme sequences from audio
- [ ] **TAJW-02**: Tajweed FSM detects 13+ named rules: Madd Tabee'i, Madd Wajib Muttasil, Madd Jaiz Munfasil, Madd Lazim, Ghunnah, Idgham bi Ghunnah, Idgham bila Ghunnah, Iqlab, Ikhfa, Qalqalah Sughra, Qalqalah Kubra, Tafkhim/Tarqiq, Waqf
- [ ] **TAJW-03**: Each violation includes rule name (English + Arabic), affected word, position, severity (minor/major), and bilingual explanation
- [ ] **TAJW-04**: Confidence threshold (0.85+) applied before surfacing violations to users
- [ ] **TAJW-05**: Tajweed violations logged to denormalized tajweed_violation_log table for analytics
- [ ] **TAJW-06**: Tajweed color coding applied to Quran text display using standard color mapping (13 categories)

### Hifz Tracker

- [x] **HIFZ-01**: User can view all 114 surahs in a color-coded grid (not started / in progress / memorized / needs review)
- [x] **HIFZ-02**: User can tap any surah to see per-ayah strength bars (0-100%)
- [x] **HIFZ-03**: Each ayah shows last reviewed date, next review due, and historical mistake count
- [x] **HIFZ-04**: User can mark individual ayahs as memorized, schedule review, or practice from ayah detail
- [x] **HIFZ-05**: Stats panel shows total memorized / 6,236 and strongest/weakest juz

### Spaced Repetition (SM-2+)

- [x] **SM2-01**: SM-2+ algorithm implemented with Wozniak formula plus modifications: proportional overdue credit, ease factor recovery after 3 consecutive correct, ±10% interval jitter
- [x] **SM2-02**: Per-ayah strength score (0.0-1.0) computed from SM-2+ repetition count
- [x] **SM2-03**: Review schedule computed locally in TypeScript for zero-latency post-session scoring
- [ ] **SM2-04**: Review schedule synced to Supabase via calculate-review-schedule Edge Function
- [x] **SM2-05**: Ease factor minimum clamped at 1.3 with recovery mechanism to prevent ease hell

### Review Queue

- [x] **REVW-01**: User sees today's review queue sorted by urgency (overdue first, then due today)
- [x] **REVW-02**: Per ayah in queue: user recites, AI grades, SM-2+ updates, next review date shown
- [x] **REVW-03**: User can start auto-built review session from queue

### Session Modes

- [x] **SESS-01**: User can start a New Memorization session for unmemorized ayahs
- [x] **SESS-02**: User can start a Review session from the review queue
- [ ] **SESS-03**: Active session shows mushaf Arabic text (hideable in hifz mode) with animated waveform
- [ ] **SESS-04**: Real-time word highlighting after AI analysis: green (correct), red (wrong), orange (tajweed violation)
- [ ] **SESS-05**: Post-session summary shows accuracy %, ayahs covered, time, mistakes by type, strength score changes
- [ ] **SESS-06**: Peek button (hold to reveal hidden text) tracked for analytics

### Dashboard

- [ ] **DASH-01**: Daily goal progress ring showing progress toward today's target
- [ ] **DASH-02**: Streak counter with current and longest streak display
- [ ] **DASH-03**: Review due badge showing count of ayahs due today, tappable to start review
- [ ] **DASH-04**: Continue where you left off card
- [ ] **DASH-05**: Weak spots widget showing 3 lowest strength-score ayahs, tappable to drill
- [ ] **DASH-06**: Activity heatmap showing 12 weeks of session intensity

### Gamification

- [ ] **GAME-01**: Daily recitation streak tracked with update-streak Edge Function
- [ ] **GAME-02**: 5 core achievements at launch: first_ayah, juz_amma, streak_7, streak_30, perfect_session
- [ ] **GAME-03**: unlock-achievements Edge Function checks criteria after each session
- [ ] **GAME-04**: Push notification reminders for review due and streak protection via send-review-reminder cron Edge Function

### Multi-Riwayah

- [x] **RIWY-01**: Every database table, API endpoint, Edge Function, and mobile screen accepts riwayah as explicit parameter
- [ ] **RIWY-02**: Riwayah selector in user profile settings (Hafs available, Warsh/Qalun/Ad-Duri shown as "Coming Soon")
- [ ] **RIWY-03**: Inference server accepts riwayah parameter and returns error for unsupported riwayahs (not silent Hafs fallback)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Extended Features

- **EXTF-01**: Word-boundary highlight during recitation (real-time visual alignment via wav2vec2 word model)
- **EXTF-02**: Juz View in Hifz tracker (30 juz with % complete + avg strength ring)
- **EXTF-03**: Page View in Hifz tracker (604 Madani pages, color per page)
- **EXTF-04**: Tajweed weakness analytics chart (per-rule violation frequency trends)
- **EXTF-05**: Voice search ("Shazam for Quran" — recite fragment, find ayah)
- **EXTF-06**: Free Recitation session mode
- **EXTF-07**: Tajweed Drill session mode
- **EXTF-08**: Monthly review calendar heatmap
- **EXTF-09**: Per-juz strength spider chart on profile
- **EXTF-10**: Extended achievement set (10+ achievements including streak_100, hafiz, speed_reviewer, iron_memory, tajweed_master)
- **EXTF-11**: Offline AI queueing (record offline, process when connected)
- **EXTF-12**: Audio playback with multiple reciters (Sheikh Hudhaify + Al-Husary)

### Multi-Riwayah ASR

- **RIWY-04**: Warsh ASR model integration when available
- **RIWY-05**: Qalun ASR model integration when available
- **RIWY-06**: Ad-Duri ASR model integration when available

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time chat / teacher messaging | High complexity, moderation burden, shifts product from tool to platform |
| Social feed / following / sharing | Privacy-sensitive for religious practice; toxic comparison risk |
| Video content / Tajweed lessons | Storage/CDN costs; app is a practice tool, not a course platform |
| Real-time streaming ASR (WebSocket) | HTTP round-trip latency acceptable (<2s); WebSocket adds server complexity |
| On-device AI inference | Models too large (50-300MB each); queue offline, process when connected |
| Web app | Mobile-first; web after product-market fit confirmed |
| Public leaderboards | Religious practice is personal; can create pride or discouragement |
| Teacher marketplace | Completely different product scope; refer to established platforms |
| Family plan / multiple profiles | Adds auth complexity; defer until retention proven |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FNDN-01 | Phase 1 | Complete |
| FNDN-02 | Phase 1 | Complete |
| FNDN-03 | Phase 1 | Complete |
| FNDN-04 | Phase 1 | Complete |
| FNDN-05 | Phase 1 | Complete |
| FNDN-06 | Phase 1 | Complete |
| FNDN-07 | Phase 1 | Complete |
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| AUDP-01 | Phase 2 | Pending |
| AUDP-02 | Phase 2 | Pending |
| AUDP-03 | Phase 2 | Pending |
| AUDP-04 | Phase 2 | Pending |
| AIRC-01 | Phase 2 | Pending |
| AIRC-02 | Phase 2 | Pending |
| AIRC-03 | Phase 2 | Pending |
| AIRC-04 | Phase 2 | Pending |
| AIRC-05 | Phase 2 | Pending |
| AIRC-06 | Phase 2 | Pending |
| AIRC-07 | Phase 2 | Pending |
| AIRC-08 | Phase 2 | Pending |
| TAJW-01 | Phase 3 | Pending |
| TAJW-02 | Phase 3 | Pending |
| TAJW-03 | Phase 3 | Pending |
| TAJW-04 | Phase 3 | Pending |
| TAJW-05 | Phase 3 | Pending |
| TAJW-06 | Phase 3 | Pending |
| HIFZ-01 | Phase 4 | Complete |
| HIFZ-02 | Phase 4 | Complete |
| HIFZ-03 | Phase 4 | Complete |
| HIFZ-04 | Phase 4 | Complete |
| HIFZ-05 | Phase 4 | Complete |
| SM2-01 | Phase 4 | Complete |
| SM2-02 | Phase 4 | Complete |
| SM2-03 | Phase 4 | Complete |
| SM2-04 | Phase 4 | Pending |
| SM2-05 | Phase 4 | Complete |
| REVW-01 | Phase 4 | Complete |
| REVW-02 | Phase 4 | Complete |
| REVW-03 | Phase 4 | Complete |
| SESS-01 | Phase 4 | Complete |
| SESS-02 | Phase 4 | Complete |
| SESS-03 | Phase 3 | Pending |
| SESS-04 | Phase 3 | Pending |
| SESS-05 | Phase 3 | Pending |
| SESS-06 | Phase 3 | Pending |
| DASH-01 | Phase 5 | Pending |
| DASH-02 | Phase 5 | Pending |
| DASH-03 | Phase 5 | Pending |
| DASH-04 | Phase 5 | Pending |
| DASH-05 | Phase 5 | Pending |
| DASH-06 | Phase 5 | Pending |
| GAME-01 | Phase 5 | Pending |
| GAME-02 | Phase 5 | Pending |
| GAME-03 | Phase 5 | Pending |
| GAME-04 | Phase 5 | Pending |
| RIWY-01 | Phase 1 | Complete |
| RIWY-02 | Phase 5 | Pending |
| RIWY-03 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 58 total
- Mapped to phases: 58
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-04 after initial definition*

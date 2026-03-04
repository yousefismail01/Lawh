# Feature Research

**Domain:** Quran Hifz (memorization) & AI recitation correction mobile app
**Researched:** 2026-03-04
**Confidence:** HIGH (market leaders analyzed, multiple sources cross-verified)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Full Quran text with tashkeel (diacritics) | Every Quran app ships this; absence is disqualifying | LOW | Must be Hafs-verified text with full tashkeel preserved. Use quran-json dataset. |
| RTL Arabic text rendering with correct script | Arabic readers expect pixel-perfect right-to-left display | MEDIUM | KFGQPC Uthmanic Hafs / Amiri Quran font. iOS and Android RTL layout tested. |
| Audio playback with multiple reciters | Users want to hear correct pronunciation while memorizing | LOW | At minimum Sheikh Hudhaify + Al-Husary. Stream or predownload. |
| Surah/Juz navigation | Users navigate by Surah name, Juz number, or page | LOW | Surah list with Arabic names, juz/hizb/rub markers. |
| Basic search (by Surah or Ayah number) | Users want to jump to a specific ayah quickly | LOW | Search by Surah name (Arabic + transliterated) + ayah number. |
| User authentication | Progress must persist across devices | LOW | Email/password + Apple Sign In + Google Sign In. Supabase Auth handles this. |
| Progress persistence and sync | Losing progress is catastrophic for Hifz students | MEDIUM | Offline-first with Supabase sync on reconnect. expo-sqlite local cache. |
| Offline access to Quran text | Many users recite in areas with poor connectivity (masjid) | MEDIUM | Quran text pre-cached in expo-sqlite on install. AI features can queue offline. |
| Recitation recording (voice input) | Core mechanic for any AI correction or memorization check | MEDIUM | 16kHz mono WAV pipeline. expo-av on mobile. |
| Word-level mistake detection | Tarteel established this as baseline — users expect it | HIGH | ASR model (tarteel-ai/whisper-base-ar-quran) transcribes, then diff against expected text. |
| Memorization progress tracking per Surah | Users need to know what they have memorized | MEDIUM | Per-Surah completion status with color-coded views (not yet memorized / weak / strong). |
| Daily streak counter | Habit formation is core to any daily-practice app | LOW | Edge function update-streak triggered on each session. |
| Push notification reminders | Without reminders, users churn in week 1 | LOW | Send-review-reminder edge function via Supabase cron + Expo push notifications. |
| Bookmarking / last position | Users return to where they stopped | LOW | Persist last ayah viewed/recited per session. |
| Tajweed color coding (visual) | Standard in major apps (Quran Majeed, Quran.com) — visual aid | LOW | CSS/font-level color coding for Tajweed categories. Not AI — this is static rule coloring. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI Tajweed rule violation classification (13+ named rules) | No competitor does named Tajweed rule detection in real-time. Tarteel only detects word-level errors, not Tajweed rules | HIGH | Finite State Machine over phoneme sequences from wav2vec2-quran-phonetics. Outputs Arabic rule names + bilingual explanations. This is the core moat. |
| Per-ayah strength scoring with SM-2 spaced repetition | Most apps track "memorized / not memorized" binary. Per-ayah SM-2 scheduling is rare and scientifically superior | HIGH | SM-2 algorithm in Supabase edge function (calculate-review-schedule). Decays strength on missed reviews, rewards correct recitation. |
| Word-boundary alignment (highlight current word during recitation) | Real-time visual feedback word-by-word during recording surpasses competitors | HIGH | Uses hamzasidhu786/wav2vec2-base-word-by-word-quran-asr for forced alignment. Highlights word as user speaks it. |
| Review queue with urgency-sorted scheduling | Intelligent "what to review today" removes decision fatigue for Hifz students | MEDIUM | Sort by SM-2 due date + days overdue. Monthly calendar heatmap showing review load. |
| Multiple session modes (new memorization / review / free recitation / Tajweed drill) | Matches how Hifz students actually practice — not one-size-fits-all | MEDIUM | Mode selector on session start. Each mode has different UI affordances and scoring behavior. |
| Hifz tracker views: Surah Grid / Juz View / Page View | Granular progress visibility — most apps show only Surah-level progress | MEDIUM | Color-coded ayah-level strength within Surah. Juz-level aggregation. Page view matching physical Mushaf layout. |
| Tajweed weakness analytics chart | Shows user their recurring Tajweed errors over time — actionable, not just corrective | MEDIUM | Per-rule violation counts aggregated in denormalized tajweed_violation_log. Rendered as chart in profile tab. |
| Multi-riwayah architecture (Hafs + Warsh/Qalun/Ad-Duri) | Serves North African, West African, and Levantine Muslims who memorize in non-Hafs riwayah — almost no competitors support this | HIGH | Riwayah field on every DB record, API param, and mobile screen from day one. Only Hafs ASR model ships v1, but architecture is ready. |
| Voice search ("Shazam for Quran") | Power feature: recite any fragment and find the ayah instantly | MEDIUM | Reuse ASR pipeline. Fuzzy match transcript against full Quran corpus. Tarteel has this but it's not universal. |
| Activity heatmap (like GitHub contribution graph) | Visual motivation — shows consistency over weeks/months at a glance | LOW | Grid of daily session dots colored by volume. Strong retention signal. |
| Per-juz strength visualization on profile | Aggregate view for students and their teachers to assess overall Hifz health | LOW | Aggregate SM-2 scores per juz. Useful for teacher-student accountability context. |
| Gamification: 10+ named achievements | Milestone rewards keep users engaged through the multi-year Hifz journey | LOW | Unlock-achievements edge function triggered by session events. E.g., "First Juz Complete", "30-day streak", "100 Tajweed corrections". |
| Offline AI queueing (submit when reconnected) | Users recite in the masjid without WiFi — offline queueing lets them practice without interruption | MEDIUM | Queue recordings locally in expo-sqlite, upload and process when connection restored. |
| Bilingual Tajweed rule explanations (Arabic + English) | Bridges gap between traditional Tajweed education (Arabic terms) and English-speaking learners | LOW | Static content per rule. Arabic rule name + English explanation + example. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time chat / teacher messaging | Users want human feedback; community feels like added value | High complexity, moderation burden, shifts product from tool to platform. Distraction from core Hifz loop. | Link to external platforms (WhatsApp groups, Zoom). Not v1. |
| Social feed / following / sharing progress | Leaderboards and social proof drive engagement | Privacy-sensitive for a religious practice context; can create toxic comparison; significant backend complexity | Private personal analytics only. Achievements are personal milestones, not public broadcasts. |
| Video content / Tajweed lessons | Users want comprehensive Tajweed curriculum in-app | Storage and CDN costs are high; video production quality bar is high; distracts from practice tool identity | Deep-link to YouTube channels or external curriculum. App is a practice tool, not a course platform. |
| Real-time streaming transcription (WebSocket ASR) | "Instant" feedback feels more magical | Requires persistent WebSocket server, much higher infrastructure cost, more complex error handling. Round-trip latency on HTTP is acceptable for recitation correction. | HTTP request/response with fast response time (<2s). Show "analyzing..." indicator. |
| Full offline AI inference (on-device models) | Users want full offline AI correction | Whisper + wav2vec2 models are 50-300MB each; would bloat app size; on-device T4-equivalent performance not available on consumer phones | Offline queueing: record offline, process when connected. Quran text always offline. |
| Web app at launch | Some users prefer browser access | Doubles implementation surface area before validating core mobile product | Mobile-first, web after product-market fit confirmed. |
| Non-Hafs riwayah ASR models at launch | Warsh/Qalun users are underserved | No production-quality ASR model for Warsh/Qalun exists yet; training or fine-tuning is a separate research project | Multi-riwayah architecture ships in DB/API/UI; ASR defaults to Hafs only in v1. Architecture is ready for models when they become available. |
| Live 1-on-1 teacher sessions (marketplace) | Quran Mobasher has this; perceived as high-value | Requires teacher vetting, scheduling system, payment processing, video infrastructure — a completely different product | Refer users to established platforms (Quran Academy, SeekersGuidance). |
| Gamified leaderboards (top memorizers) | Seems motivating | Religious practice is personal; public competition can create pride or discouragement; data sensitivity | Personal achievement badges and streaks. Private progress only. |

## Feature Dependencies

```
User Authentication
    └──requires──> All progress features (Hifz tracker, review queue, analytics)

Quran Text DB (full tashkeel, riwayah field)
    └──requires──> RTL Arabic rendering
    └──requires──> Word-level mistake detection (needs expected text to diff against)
    └──requires──> Tajweed color coding (needs text structure)

Audio Recording Pipeline
    └──requires──> AI recitation correction (backend receives audio)
    └──requires──> Voice search

AI Recitation Correction (word-level diff)
    └──requires──> Audio Recording Pipeline
    └──requires──> Quran Text DB
    └──enhances──> Per-ayah strength scoring (feeds SM-2 input signal)

Tajweed Rule Classification (FSM over phonemes)
    └──requires──> Audio Recording Pipeline
    └──requires──> wav2vec2 phoneme model (separate from ASR)
    └──enhances──> AI Recitation Correction (adds Tajweed dimension to mistake log)
    └──requires──> Bilingual rule explanation content

Per-ayah Strength Scoring (SM-2)
    └──requires──> AI Recitation Correction (to know if ayah was recited correctly)
    └──requires──> Review schedule edge function (calculate-review-schedule)
    └──enhances──> Review Queue (SM-2 scores drive urgency sorting)

Review Queue
    └──requires──> Per-ayah Strength Scoring
    └──requires──> SM-2 scheduling edge function
    └──enhances──> Monthly calendar heatmap

Hifz Tracker Views (Surah Grid / Juz / Page)
    └──requires──> Per-ayah Strength Scoring
    └──enhances──> Per-juz strength visualization on Profile

Tajweed Weakness Analytics
    └──requires──> Tajweed Rule Classification
    └──requires──> tajweed_violation_log table (denormalized)

Daily Streak
    └──requires──> User Authentication
    └──requires──> Session completion event → update-streak edge function

Gamification Achievements
    └──requires──> Daily Streak
    └──requires──> Hifz Tracker (for "first juz complete" type achievements)
    └──requires──> unlock-achievements edge function

Push Notification Reminders
    └──requires──> User Authentication
    └──requires──> Review Queue (to know what's due)
    └──requires──> send-review-reminder cron edge function

Multi-riwayah (Warsh/Qalun in UI/DB)
    └──requires──> Riwayah param on all API calls and DB queries from day one
    └──conflicts──> Hafs-only ASR assumption (must not hardcode Hafs at inference layer)

Offline AI Queueing
    └──requires──> Audio Recording Pipeline
    └──requires──> expo-sqlite local queue
    └──enhances──> Offline-first UX
```

### Dependency Notes

- **AI Recitation Correction requires Quran Text DB:** The mistake detection works by diffing ASR transcript against expected ayah text. The expected text must be in the DB with tashkeel for accurate comparison.
- **Tajweed Rule Classification requires a separate model:** The phoneme-level FSM runs on wav2vec2-quran-phonetics output, not the same ASR model used for word-level detection. Both must process the same audio recording.
- **SM-2 requires correct/incorrect signal from AI correction:** The spaced repetition score update only fires after a recitation session. The AI correction provides the pass/fail and error count that feeds SM-2's ease factor calculation.
- **Multi-riwayah architecture conflicts with Hafs-only inference assumption:** The riwayah param must flow through every layer (DB, API, mobile) but the ASR model only handles Hafs in v1. The inference server must accept riwayah and return an error for unsupported riwayahs rather than silently processing as Hafs.
- **Offline queueing conflicts with real-time feedback UX:** When offline, the user cannot receive immediate AI feedback. The app must clearly communicate "offline mode — recitation queued for analysis" rather than showing incorrect silence as correct.

## MVP Definition

### Launch With (v1)

Minimum viable product — validates the core value proposition: AI-powered recitation correction with Tajweed detection.

- [ ] User authentication (email/password + Apple Sign In + Google Sign In) — required for any persistence
- [ ] Full Quran text with tashkeel in Supabase, RTL rendering in React Native — foundational for everything
- [ ] Audio recording pipeline (16kHz mono WAV) — required for all AI features
- [ ] Word-level mistake detection via tarteel-ai/whisper-base-ar-quran — core differentiator baseline
- [ ] Tajweed rule violation classification (13 rules, FSM) with bilingual explanations — the primary moat
- [ ] Per-ayah strength scoring with SM-2 spaced repetition — makes the app a learning system, not just a tester
- [ ] Review queue with urgency sorting — the daily driver that brings users back
- [ ] Hifz tracker (Surah Grid view minimum) with color-coded per-ayah strength — makes progress visible
- [ ] Dashboard with daily goal, streak counter, and activity heatmap — habit formation surface
- [ ] Session modes: new memorization + review (the two core modes) — matches primary user workflows
- [ ] Offline-first Quran text (expo-sqlite cache) — masjid use case is non-negotiable
- [ ] Push notification reminders — critical for day 1-7 retention
- [ ] Basic gamification: streak counter + 5 core achievements — motivation scaffolding
- [ ] Row Level Security on all user tables — security non-negotiable before any real users

### Add After Validation (v1.x)

Features to add once core AI loop is working and users are retained.

- [ ] Word-boundary highlight during recitation — adds delight but complex; validate core accuracy first
- [ ] Juz View and Page View in Hifz tracker — add after Surah Grid is validated
- [ ] Tajweed weakness analytics chart — requires accumulated data; add after week 2
- [ ] Voice search ("Shazam for Quran") — power feature for engaged users; add after core retention is confirmed
- [ ] Free recitation + Tajweed drill session modes — expand session types after validating core modes
- [ ] Monthly review calendar heatmap — visualization improvement for power users
- [ ] Per-juz strength on profile — useful once users have multi-juz data
- [ ] 10+ full achievement set — expand beyond 5 core achievements based on which behaviors to reinforce
- [ ] Offline AI queueing — implement after validating online flow is stable

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Warsh / Qalun / Ad-Duri ASR models — architecture is ready; defer until models exist or are trained
- [ ] Family plan / multiple profiles — multi-user management adds auth complexity; defer until retention proven
- [ ] Teacher-student accountability mode — requires separate permission model; validate solo use first
- [ ] iPad / tablet layout optimization — address after phone UX is polished
- [ ] Web app — mobile PMF first, then web

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Word-level mistake detection | HIGH | HIGH | P1 |
| Tajweed rule classification (13 rules) | HIGH | HIGH | P1 |
| Per-ayah SM-2 strength scoring | HIGH | MEDIUM | P1 |
| Full Quran text with tashkeel + RTL render | HIGH | MEDIUM | P1 |
| Audio recording pipeline | HIGH | MEDIUM | P1 |
| User authentication | HIGH | LOW | P1 |
| Review queue (urgency sorted) | HIGH | MEDIUM | P1 |
| Hifz tracker — Surah Grid view | HIGH | MEDIUM | P1 |
| Offline Quran text (expo-sqlite) | HIGH | MEDIUM | P1 |
| Push notification reminders | HIGH | LOW | P1 |
| Daily streak + dashboard | MEDIUM | LOW | P1 |
| Core gamification (5 achievements) | MEDIUM | LOW | P1 |
| Session modes: memorization + review | HIGH | MEDIUM | P1 |
| Tajweed weakness analytics chart | MEDIUM | MEDIUM | P2 |
| Word-boundary highlight during recitation | MEDIUM | HIGH | P2 |
| Juz View / Page View in tracker | MEDIUM | LOW | P2 |
| Voice search ("Shazam for Quran") | MEDIUM | MEDIUM | P2 |
| Free recitation + Tajweed drill modes | MEDIUM | LOW | P2 |
| Offline AI queueing | MEDIUM | MEDIUM | P2 |
| Activity heatmap (GitHub-style) | LOW | LOW | P2 |
| Per-juz strength on profile | LOW | LOW | P2 |
| Extended achievement set (10+) | LOW | LOW | P2 |
| Multi-riwayah ASR models (Warsh/Qalun) | HIGH | VERY HIGH | P3 |
| Teacher-student mode | MEDIUM | HIGH | P3 |
| Web app | MEDIUM | HIGH | P3 |
| Family plan | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Tarteel | Quran Companion | TajweedMate | El-Mohafez | Our Approach |
|---------|---------|-----------------|-------------|------------|--------------|
| Word-level mistake detection | YES (AI, v1 only) | NO | NO | NO | YES — baseline parity |
| Tajweed rule detection (named rules) | NO (color-coding only; rule AI on roadmap) | NO | YES (limited rules, lesson format) | NO | YES — real-time FSM classification, the core moat |
| Per-ayah strength scoring | NO (surah-level) | NO | NO | NO | YES — per-ayah SM-2 |
| Spaced repetition scheduling | Goals-based only, not algorithmic SM-2 | NO | NO | NO | YES — SM-2 with proper ease factor decay |
| Review queue (due today) | Partial (goal tracking) | NO | NO | NO | YES — urgency-sorted queue |
| Hifz tracker granularity | Surah-level | Checklist-based | NO | NO | Per-ayah color-coded strength across Surah/Juz/Page views |
| Multi-riwayah support | NO | NO | NO | YES (16 riwayah for text/audio) | YES — architecture from day one; Hafs ASR only in v1 |
| Voice search | YES | NO | NO | NO | YES — v1.x (reuse ASR pipeline) |
| Offline text | YES | YES | NO | YES | YES — expo-sqlite pre-cached |
| Gamification | Streaks + badges | Leaderboards | NO | NO | Streaks + personal achievements (no public leaderboards) |
| Social features | NO | YES (groups, leaderboards) | NO | NO | Deliberately NO (privacy, focus) |
| Teacher sessions | NO | NO | NO | NO | Deliberately NO in v1 |
| Bilingual Tajweed explanations | NO | NO | Partial (English lesson content) | NO | YES — Arabic rule name + English explanation per violation |
| Tajweed weakness analytics | NO | NO | NO | NO | YES — per-rule violation trends chart |

## Sources

- [Tarteel AI App Store listing](https://apps.apple.com/us/app/tarteel-ai-quran-memorization/id1391009396) — verified feature set
- [Tarteel AI in-depth analysis (Skywork)](https://skywork.ai/skypage/en/Tarteel-AI-In-Depth-Revolutionizing-Quranic-Learning-with-Artificial-Intelligence/1972883987285209088) — HIGH confidence feature analysis
- [Top 50+ Quran Memorization Apps (howtomemorisethequran.com)](https://howtomemorisethequran.com/top-quran-memorization-apps/) — MEDIUM confidence market landscape
- [Best Quran Apps 2025 Review (Quran in Depth)](https://www.quranindepth.com/blog/best-quran-apps-2025-review) — MEDIUM confidence feature categorization
- [Tarteel blog: Spaced Repetition and Quran Memorization](https://tarteel.ai/blog/spaced-repetition-and-quran-memorization-how-to-make-your-hifz-stick-for-life/) — confirms Tarteel does NOT implement SM-2 algorithmically
- [TajweedMate App](https://tajweedmate.com/) — MEDIUM confidence for Tajweed lesson format competitor
- [NeurIPS 2025: TajweedAI Hybrid ASR-Classifier](https://neurips.cc/virtual/2025/133028) — HIGH confidence for Tajweed AI research state
- [Quran Hifz Revision on Google Play (SM-2 implementation)](https://play.google.com/store/apps/details?id=com.github.ahmad_hossain.quranspacedrepetition&hl=en_US) — confirms SM-2 in Quran space is rare but exists
- [Review: Tarteel limitations on Tajweed detection](https://yokersane.com/review-tarteel-vs-companion-testimoni-indonesia/) — MEDIUM confidence, confirms Tarteel has no Tajweed rule AI in production

---
*Feature research for: Quran Hifz & AI Recitation Correction mobile app*
*Researched: 2026-03-04*

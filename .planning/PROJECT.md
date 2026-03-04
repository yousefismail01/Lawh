# Lawh — Quran Hifz & Recitation AI App

## What This Is

An AI-powered Quran memorization (Hifz) tracker and recitation correction app for iOS and Android. Built with React Native (Expo), Supabase, and a FastAPI AI inference server, it provides real-time word-level mistake detection, Tajweed rule violation classification, spaced repetition review scheduling, and the most comprehensive memorization tracking system in any Quran app. Targets all Muslims regardless of level.

## Core Value

AI-powered recitation correction with word-level accuracy and Tajweed rule detection — the one capability that transforms passive memorization into active, feedback-driven learning.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] AI recitation correction with real-time word-level mistake detection
- [ ] Tajweed rule violation classification (13+ rules with Arabic names and explanations)
- [ ] Comprehensive Hifz tracker with per-ayah strength scoring
- [ ] SM-2 spaced repetition review engine with intelligent scheduling
- [ ] Multi-riwayah architecture (Hafs ships v1, Warsh/Qalun/Ad-Duri architected from day one)
- [ ] Full Quran text with tashkeel, surah metadata, juz/hizb/rub markers
- [ ] Audio recording pipeline (16kHz mono WAV) with offline queueing
- [ ] User authentication (email/password + Apple Sign In + Google Sign In)
- [ ] Multiple session modes: new memorization, review, free recitation, tajweed drill
- [ ] Hifz tracker views: Surah Grid, Juz View, Page View with color-coded progress
- [ ] Dashboard with daily goals, streak counter, weak spots, activity heatmap
- [ ] Review queue with urgency sorting and monthly calendar heatmap
- [ ] Profile/analytics with Tajweed weakness charts, per-juz strength, achievements
- [ ] Gamification: streaks, 10+ achievements, push notification reminders
- [ ] Offline-first: Quran text cached in expo-sqlite, progress syncs on reconnect
- [ ] RTL Arabic text rendering with full tashkeel and Tajweed color coding
- [ ] Row Level Security on all user tables — no cross-user data leakage

### Out of Scope

- Real-time chat — high complexity, not core to Hifz value
- Video content — storage/bandwidth costs, defer to future
- Web app — mobile-first, web later
- Non-Hafs riwayah ASR models — architecture supports it, but only Hafs ships in v1
- Social features (following, sharing) — focus on personal memorization journey first

## Context

- **Architecture:** React Native (Expo) → Supabase (auth, DB, realtime, edge functions, storage) + FastAPI on AWS EC2 g4dn.xlarge (GPU inference only)
- **AI Models:** tarteel-ai/whisper-base-ar-quran (primary ASR), TBOGamer22/wav2vec2-quran-phonetics (Tajweed phonemes), hamzasidhu786/wav2vec2-base-word-by-word-quran-asr (word boundaries) — all int8 quantized on NVIDIA T4
- **Quran Data:** quran-json dataset seeded into Supabase ayahs table with full tashkeel, every record has riwayah field
- **Edge Functions:** calculate-review-schedule (SM-2), update-streak, unlock-achievements, send-review-reminder (cron)
- **Arabic text handling:** NFC Unicode normalization, tashkeel stripping for comparison, hamza/alef/ta-marbuta/alef-maqsura normalization
- **Tajweed engine:** Finite State Machine detecting 13+ rules from phoneme sequences with severity levels and bilingual explanations
- **Font:** KFGQPC Uthmanic Hafs or Amiri Quran for Arabic rendering
- **Database:** 10 tables with full RLS, SM-2 review_schedule, denormalized tajweed_violation_log for analytics

## Constraints

- **Tech Stack:** React Native with Expo (managed workflow), TypeScript strict, Supabase for all backend except GPU inference
- **AI Inference:** FastAPI on EC2 g4dn.xlarge with NVIDIA T4 GPU — no local database, writes to Supabase via service role key
- **Security:** Supabase anon key only in mobile app, service role key server-only, RLS on all user tables
- **Multi-Riwayah:** Every layer (DB, API, mobile) must accept riwayah as explicit parameter — non-negotiable architectural constraint
- **Arabic Accuracy:** All Arabic text with full tashkeel preserved for display, NFC normalized, RTL pixel-perfect on iOS and Android
- **Offline:** Quran text and progress cached locally in expo-sqlite, syncs to Supabase on reconnect

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase as primary backend (not custom) | Handles auth, DB, realtime, edge functions, storage — reduces infrastructure complexity | — Pending |
| FastAPI as inference-only microservice | Isolates GPU workload, Supabase is single source of truth, no local DB needed | — Pending |
| SM-2 (Wozniak) for spaced repetition | Proven algorithm, well-understood, maps cleanly to per-ayah strength scoring | — Pending |
| Expo managed workflow | Faster development, OTA updates, eject available if needed | — Pending |
| Multi-riwayah from day one | Retrofitting is exponentially harder — bake riwayah into every layer now | — Pending |
| Tajweed FSM approach | Rule-based detection from phoneme sequences is more deterministic than ML classification | — Pending |
| int8 quantization for all models | Halves VRAM usage on T4 GPU with minimal accuracy loss | — Pending |

---
*Last updated: 2026-03-04 after initialization*

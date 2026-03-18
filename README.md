# Lawh

AI-powered Quran memorization (Hifz) app for iOS and Android. Combines a full 604-page Madinah Mushaf reader with spaced repetition review scheduling, guided daily sessions, and upcoming AI recitation correction.

## Features

- **Full Quran Text** — 6,236 ayahs across 114 surahs with complete tashkeel, RTL rendering, and NFC normalization
- **604-Page Mushaf** — Page-accurate Madinah layout with V4 Tajweed color fonts (COLRv1), swipeable pages, and customizable banner themes
- **Hifz Tracker** — 114-surah grid with color-coded memorization progress and per-page confidence heatmap
- **Spaced Repetition** — SM-2+ algorithm with per-ayah strength scoring, urgency-based review queue, and dhor cycle scheduling
- **Guided Daily Sessions** — Structured sabaq (new) → sabqi (recent review) → dhor (long-term review) flow with level-adaptive tiers
- **Multi-Riwayah Architecture** — Hafs active, Warsh/Qalun/Ad-Duri ready across all layers (DB, API, mobile)
- **Offline-First** — Local SQLite storage with Supabase sync
- **Authentication** — Email/password, Apple Sign In, Google Sign In

### Planned

- AI word-level recitation correction via Whisper + phonetic models
- Tajweed rule classification (13+ rules, 0.85+ confidence threshold)
- Dashboard with activity heatmap, streaks, and achievements
- Multi-view schedule (day/week/month) with missed day recovery

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.83 + Expo SDK 55, TypeScript strict |
| Navigation | Expo Router (file-based) |
| State | Zustand, TanStack React Query |
| Backend | Supabase (Auth, PostgreSQL, Realtime, Edge Functions, Storage) |
| AI Inference | FastAPI on AWS EC2 g4dn.xlarge (NVIDIA T4 GPU) |
| Audio | @mykin-ai/expo-audio-stream (16kHz mono WAV) |
| Database | PostgreSQL with RLS, SM-2 spaced repetition, multi-riwayah PKs |

## Project Structure

```
lawh/
├── lawh-mobile/          # React Native + Expo app
│   ├── app/              # Expo Router screens (auth, main, dynamic routes)
│   ├── components/       # UI components (hifz, mushaf, quran, session)
│   ├── services/         # Data services (quran, hifz, audio, tafsir)
│   ├── stores/           # Zustand stores (auth, settings, hifz, session)
│   ├── hooks/            # Custom hooks (quranData, fonts, theme)
│   ├── lib/              # Core logic (algorithms, fonts, data, arabic utils)
│   └── assets/           # Quran data, fonts, images
├── lawh-api/             # FastAPI inference server
│   ├── app/              # Routes, config, Riwayah enum
│   ├── Dockerfile
│   └── nginx/            # Reverse proxy
├── supabase/             # Migrations and edge functions
└── scripts/              # Utility scripts
```

## Getting Started

### Prerequisites

- Node.js v22 (via nvm)
- Expo CLI
- iOS: Xcode 15+
- Android: Android Studio

### Setup

```bash
# Clone
git clone https://github.com/yousefismail01/Lawh.git
cd Lawh

# Install mobile dependencies
cd lawh-mobile
npm install

# Configure environment
cp .env.example .env
# Add your EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY

# Start dev server (requires dev build — Expo Go only supports SDK 54)
npx expo start
```

### API Server

```bash
cd lawh-api
cp .env.example .env
# Add SUPABASE_URL and SUPABASE_SERVICE_KEY

docker compose up
```

## Security

- Supabase anon key only in mobile app — service role key is server-only
- Row-Level Security on all user tables
- See [SECURITY.md](SECURITY.md) for full policy

## License

All rights reserved.

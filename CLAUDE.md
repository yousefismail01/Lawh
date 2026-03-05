# Lawh

Lawh is an AI-powered Quran memorization (Hifz) and recitation correction app for iOS and Android.

## Tech Stack

- Mobile: React Native + Expo (managed workflow), TypeScript strict
- Backend: Supabase (auth, DB, realtime, edge functions, storage)
- AI Inference: FastAPI on AWS EC2 g4dn.xlarge (NVIDIA T4 GPU) — stateless, writes to Supabase via service role key
- Audio: @mykin-ai/expo-audio-stream (16kHz mono WAV)
- Database: 10 tables, full RLS, SM-2 spaced repetition, multi-riwayah PK

## Security

All code changes MUST comply with SECURITY.md at the project root.
Read SECURITY.md before writing any code that touches:
- Authentication or user data
- Supabase queries or RLS policies
- Environment variables or secrets
- API endpoints or server routes
- Database functions or RPCs

## Non-Negotiable Constraints

- Supabase anon key only in mobile app — service role key is server-only (FastAPI, edge functions, never mobile)
- RLS on ALL user tables — no exceptions
- Multi-riwayah: every DB/API/mobile layer accepts riwayah as an explicit typed parameter
- Arabic text: full tashkeel preserved for display, NFC normalized, RTL on iOS + Android
- FastAPI is inference-only — no local database, writes to Supabase via service role key only
- Tajweed violations require 0.85+ confidence before surfacing to users

## Key Paths

- Mobile app: lawh-mobile/
- FastAPI inference: lawh-api/
- Supabase migrations: supabase/migrations/
- Planning docs: .planning/

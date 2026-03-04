# Phase 1: Foundation - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up a correct, secure, multi-riwayah-ready base: Expo project with TypeScript strict, Supabase with full schema (10 tables + RLS), Quran data seed with normalized text, auth flow (email + Apple + Google), expo-sqlite offline cache, RTL Arabic rendering, and FastAPI skeleton on EC2. Everything downstream (AI, Hifz tracking, review) builds on this foundation — getting Arabic normalization, multi-riwayah schema, and RLS right here prevents full-stack rewrites later.

</domain>

<decisions>
## Implementation Decisions

### Expo Project Setup
- Expo SDK 55 with managed workflow (eject available if needed)
- Expo Router v3 for file-based routing with tabs + stacks layout
- TypeScript strict mode throughout — non-negotiable
- Tab structure: Home (Dashboard), Hifz, Recite, Review, Profile — 5 tabs
- Zustand for client-side global state (authStore, sessionStore, settingsStore)
- TanStack Query for inference API calls only (not Supabase queries)

### Supabase Schema
- All 10 tables as specified in the provided schema: surahs, ayahs, profiles, hifz_progress, recitation_sessions, recitation_attempts, tajweed_violation_log, review_schedule, goals, achievements + user_achievements
- RLS enabled on ALL user-facing tables with deny-all default before policies
- RLS policies: "Users access own data only" using `auth.uid() = user_id` on every user table
- Reference tables (surahs, ayahs, achievements) are read-only public access
- Composite unique key on ayahs: `(surah_id, ayah_number, riwayah)` — multi-riwayah from day one
- Add `normalized_text` column to ayahs table alongside `text_uthmani` — pre-computed for comparison
- All indexes as specified: hifz_progress(user_id, status), hifz_progress(user_id, strength_score), review_schedule(user_id, due_date), etc.
- Use Supabase migrations for schema management

### Quran Data Seed
- Source: quran-json open dataset bundled locally
- Seed all 114 surahs with Arabic name, transliteration, English name, ayah count, juz_start, revelation type
- Seed all 6,236 ayahs with full tashkeel (`text_uthmani`), surah_id, ayah_number, juz/hizb/rub/page numbers
- Default riwayah = 'hafs' on all seeded records
- Pre-compute `normalized_text` during seed: strip tashkeel → normalize hamza variants (أ إ آ ء ئ ؤ → canonical) → normalize alef (ا أ إ آ ٱ) → normalize ta marbuta (ة/ه) → normalize alef maqsura (ى/ي) → NFC normalize
- Seed achievements table with the 10 defined achievements (first_ayah through tajweed_master)

### Authentication
- Supabase Auth with email/password + Apple Sign In + Google Sign In
- AsyncStorage for session persistence across app restarts
- Auto-create profile row on signup via Supabase auth trigger (insert into profiles on auth.users insert)
- Default profile: target_riwayah = 'hafs', daily_goal_minutes = 15, daily_goal_ayahs = 5
- Supabase client initialized with anon key only — service role key NEVER in mobile app
- `detectSessionInUrl: false` required for React Native

### Arabic Text Rendering
- KFGQPC Uthmanic Hafs font (primary) with Amiri Quran as fallback
- Font loaded via expo-font at app startup
- RTL layout enforced for all Arabic text components
- Full tashkeel preserved in display — never strip for rendering
- Tajweed color coding applied via standard color map (13 categories from TAJWEED_COLORS constant)
- AyahText component handles: Arabic text display, tashkeel rendering, RTL alignment, Tajweed color overlays

### Offline Cache (expo-sqlite)
- expo-sqlite with Drizzle ORM for type-safe queries
- Seed all Quran text (surahs + ayahs) from Supabase to local SQLite on first launch
- `useLiveQuery` hook for reactive updates on DB changes
- Schema mirrors Supabase for surahs and ayahs tables
- Chunked seeding to avoid blocking UI thread during first launch
- quranService.ts: reads from local SQLite first, falls back to Supabase if not cached

### Surah/Juz Navigation
- Surah list with Arabic name, transliteration, English name, ayah count, revelation type
- Juz/Hizb/Rub markers displayed on ayah detail
- Basic search by Surah name (Arabic + transliterated) and ayah number
- SurahHeader component with Bismillah decoration

### FastAPI Skeleton
- FastAPI project initialized on EC2 g4dn.xlarge with /health endpoint
- Docker + docker-compose configuration ready
- Environment variables configured: SUPABASE_URL, SUPABASE_SERVICE_KEY, DEVICE=cuda
- Nginx reverse proxy with Let's Encrypt SSL on port 443
- No model loading in this phase — just the skeleton and health check

### Multi-Riwayah Architecture
- Every function, query, API endpoint, and Edge Function accepts `riwayah` as explicit typed parameter
- TypeScript: `Riwayah` union type = 'hafs' | 'warsh' | 'qalun' | 'ad_duri'
- Python: riwayah parameter with validation on all endpoints
- RIWAYAT constant with availability flags (only hafs = true in v1)
- UI: riwayah selector shows available vs "Coming Soon"

### Claude's Discretion
- Exact folder structure within mobile/ (follow Expo Router conventions)
- Loading states and splash screen design
- Error boundary implementation approach
- Exact chunking strategy for SQLite seed (batch size, progress indicator)
- Supabase migration file organization
- Nginx configuration details for EC2

</decisions>

<specifics>
## Specific Ideas

- Arabic Unicode normalization pipeline must handle: NFC normalization, tashkeel stripping for comparison, hamza variant normalization (أ إ آ ء ئ ؤ), alef variant normalization (ا أ إ آ ٱ), ta marbuta normalization (ة vs ه), alef maqsura normalization (ى vs ي) — this is critical and specified exactly
- Supabase client must use `detectSessionInUrl: false` for React Native compatibility
- Row Level Security must be enabled BEFORE writing policies (deny-all default)
- The Tajweed color map is exactly specified with 13 categories and hex values
- Achievements seed data exactly as specified: first_ayah, juz_amma, streak_7, streak_30, streak_100, perfect_session, hafiz, speed_reviewer, iron_memory, tajweed_master
- "This app will be used by Muslims for ibadah — build it with care, accuracy, and deep respect"

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — this phase establishes the foundational patterns

### Integration Points
- Supabase client (lib/supabase.ts) will be the primary integration point for all subsequent phases
- expo-sqlite local DB will be the offline read source for all Quran text access
- Auth state (authStore) will gate all authenticated screens
- Riwayah type system established here constrains all downstream API contracts

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-04*

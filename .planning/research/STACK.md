# Stack Research

**Domain:** AI-powered mobile Quran Hifz tracker and recitation correction app
**Researched:** 2026-03-04
**Confidence:** MEDIUM-HIGH (core stack HIGH, AI inference layer MEDIUM, audio pipeline MEDIUM)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Expo SDK | 55.x (React Native 0.83) | Mobile app framework | Current stable as of March 2026. New Architecture only (Legacy dropped in SDK 55), Hermes v1 default, OTA updates via EAS. Managed workflow avoids ejection until necessary. Expo SDK v55 ships expo-router v55 bundled. |
| TypeScript | 5.x (strict mode) | Type safety | Non-negotiable for a codebase with complex domain types (ayah refs, riwayah enums, SM-2 structs, Tajweed rules). Strict mode catches null/undefined bugs at compile time rather than device crashes. |
| Expo Router | 55.x | File-based navigation | Ships with Expo SDK 55, built on React Navigation 7. File-based routing reduces navigation boilerplate and enables deep linking automatically — critical for review reminders that deep-link into specific ayahs. |
| Supabase | @supabase/supabase-js ^2.x | Auth, database, realtime, edge functions, storage | Handles all backend except GPU inference: Postgres with RLS, row-level security, OAuth providers (Apple + Google), Edge Functions for SM-2 scheduling, Realtime for sync events, Storage for audio uploads. Single backend service reduces ops surface. |
| FastAPI | ^0.115 | GPU inference microservice | Python-native ML ecosystem (PyTorch, Transformers, faster-whisper all speak Python). Async endpoint support means the single GPU worker can queue multiple inference requests without blocking. Deployed as Docker container on EC2 g4dn.xlarge. |
| Zustand | ^5.x | Client-side UI state | Minimal boilerplate for managing session state, recording state, active surah/ayah cursor. Does not own server state — that belongs to TanStack Query. 40% smaller bundle than Redux equivalent. |
| TanStack Query | ^5.x | Server state & caching | Manages all Supabase and FastAPI fetch lifecycles: loading, stale-while-revalidate, retry on reconnect, background refetch. Pairs with Zustand so the two responsibilities are cleanly separated. |

### Supporting Libraries — Mobile (React Native / Expo)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-sqlite | ^15.x (SDK 55) | Offline-first local database | All Quran text, user progress, and SM-2 review schedules stored locally. Source of truth on device; syncs to Supabase on reconnect. SDK 54+ ships stable new API with web localStorage polyfill and SQLite extensions support. |
| drizzle-orm | ^0.40.x | Type-safe ORM over expo-sqlite | Write SQL schema in TypeScript, get full type inference on queries. `useLiveQuery` hook re-renders components when underlying rows change — critical for live progress dashboards. Use `drizzle.config.ts` with `driver: 'expo'`. |
| @mykin-ai/expo-audio-stream | latest | 16kHz mono WAV audio recording | Standard expo-av cannot record 16kHz mono WAV natively — required by Whisper-based ASR models. This library is purpose-built for speech recognition pipelines: dual-stream output (full quality + 16kHz downsampled), real-time audio chunks via callbacks, offline queueing support. |
| expo-notifications | ^0.29.x (SDK 55) | Push notification reminders | Review reminders sent via Supabase Edge Function cron job. Requires FCM (Android) and APNs (iOS) configured in EAS. expo-notifications handles token registration and foreground/background handling. |
| expo-font | ^13.x (SDK 55) | Custom Arabic font loading | Load KFGQPC Uthmanic Hafs or Amiri Quran TTF at app startup. Use `useFonts` hook with `SplashScreen.preventAutoHideAsync()` to prevent flash of unstyled Arabic text. |
| react-native-url-polyfill | ^2.x | URL API polyfill | Required by @supabase/supabase-js in React Native environment. Import at the top of `index.js` before Supabase client initialization. |
| @react-native-async-storage/async-storage | ^2.x | Supabase auth session persistence | Supabase auth requires a storage adapter to persist JWT tokens across app restarts. AsyncStorage is the standard adapter in React Native. |
| expo-secure-store | ^14.x (SDK 55) | Secure storage for sensitive tokens | Use for storing Supabase refresh tokens and any API keys that must not be accessible in plain AsyncStorage. Backed by iOS Keychain and Android Keystore. |
| react-native-reanimated | ^3.x | Smooth progress animations | Color-coded Surah Grid progress bars, streak counter animations, review queue swipe gestures. Required peer dependency of many gesture and animation libraries. |
| react-native-gesture-handler | ^2.x | Native gesture recognition | Review queue swipe-to-dismiss gestures, pull-to-refresh patterns. Must be initialized at the root of the app. |
| expo-haptics | ^14.x (SDK 55) | Tactile feedback | Achievement unlocks, correct/incorrect recitation feedback. Low-effort quality-of-life improvement for mobile. |
| @shopify/react-native-skia | ^1.x | Tajweed color-coding overlays | Standard Text component cannot apply per-character color (e.g., coloring individual harakat differently). Skia Canvas enables word-level and character-level color overlays on Arabic text while keeping the KFGQPC font. Use only for Tajweed drill mode; standard Text component suffices elsewhere. |

### Supporting Libraries — Server (FastAPI / Python)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| faster-whisper | ^1.2.1 | Optimized Whisper ASR inference | CTranslate2-based reimplementation of Whisper that is 4-6x faster than vanilla `openai/whisper` at equal accuracy. Use `compute_type="int8_float16"` for NVIDIA T4 GPU — halves VRAM with minimal accuracy drop. Loads `tarteel-ai/whisper-base-ar-quran` weights. |
| transformers | ^4.47.x | wav2vec2 model loading | Loads `TBOGamer22/wav2vec2-quran-phonetics` (Tajweed phonemes) and `hamzasidhu786/wav2vec2-base-word-by-word-quran-asr` (word boundaries). Use `pipeline("audio-classification", device=0)` with `torch_dtype=torch.float16` for GPU. |
| torch | ^2.5.x (CUDA 12.x build) | GPU tensor operations | Backend for transformers and wav2vec2 inference. Install the CUDA-specific wheel: `torch==2.5.1+cu121`. Do NOT install CPU-only build on GPU instance. |
| pydantic | ^2.x | Request/response validation | FastAPI uses Pydantic v2 natively for endpoint schemas. Define `RecitationRequest` and `InferenceResponse` models with riwayah as explicit required field. |
| python-multipart | ^0.0.x | Multipart file upload parsing | Handles audio file uploads (`multipart/form-data`) in FastAPI endpoints. Required when accepting audio file bytes from the mobile client. |
| httpx | ^0.28.x | Supabase write-back client | FastAPI server writes inference results to Supabase via the REST API using the service role key. Use `httpx.AsyncClient` to avoid blocking the event loop during network I/O. |
| uvicorn | ^0.32.x | ASGI server | Production ASGI server for FastAPI. Run behind Gunicorn with `UvicornWorker` class for multi-process management on EC2. Single worker per GPU recommended to avoid VRAM contention. |
| gunicorn | ^23.x | Process manager | Manages Uvicorn worker lifecycle: restarts crashed workers, handles SIGTERM gracefully. Use `--workers 1` on g4dn.xlarge (single T4 GPU) to prevent OOM from multiple models loaded simultaneously. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| EAS CLI | Expo Application Services build and submit | Required for TestFlight / Play Store distribution. `eas build --profile production` triggers cloud build. Configure `eas.json` with separate development/preview/production profiles. |
| EAS Update | OTA JavaScript bundle updates | Push JS-layer fixes without App Store review. Works with Expo Router. Production channel should use `runtimeVersion: { policy: "appVersion" }` to avoid deploying incompatible bundles. |
| Drizzle Studio | SQLite visual inspector during development | `npx expo start` with `expo-drizzle-studio-plugin` lets you inspect local SQLite tables on device. Remove from production build. |
| Docker | Containerize FastAPI inference server | Use `nvidia/cuda:12.1-runtime-ubuntu22.04` base image. Ensures reproducible CUDA environment on EC2. |
| supabase CLI | Local Supabase development & migrations | `supabase db push` applies schema migrations. `supabase functions deploy` deploys Edge Functions. Use for local dev environment to avoid hitting production. |

---

## Installation

```bash
# React Native / Expo (inside Expo project)
npx expo install expo-router expo-sqlite expo-font expo-notifications expo-haptics expo-secure-store

# Audio (16kHz WAV recording for ASR)
npm install @mykin-ai/expo-audio-stream

# State management
npm install zustand @tanstack/react-query

# Supabase client + required polyfills
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill

# ORM
npm install drizzle-orm
npm install -D drizzle-kit

# Animations & gestures
npx expo install react-native-reanimated react-native-gesture-handler

# Tajweed color-coding (install only if needed for drill mode)
npm install @shopify/react-native-skia

# Python / FastAPI inference server (in requirements.txt)
# fastapi==0.115.*
# uvicorn[standard]==0.32.*
# gunicorn==23.*
# pydantic==2.*
# python-multipart==0.0.*
# httpx==0.28.*
# torch==2.5.1+cu121   # from https://download.pytorch.org/whl/cu121
# transformers==4.47.*
# faster-whisper==1.2.*
# accelerate==1.2.*    # required for device_map="auto" in transformers
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Expo SDK 55 (managed) | Bare React Native | Only if you need native modules unavailable in Expo (e.g., custom DSP audio processing). Expo managed workflow covers all requirements here including custom fonts, audio, SQLite, push notifications. |
| @mykin-ai/expo-audio-stream | expo-av (expo-audio) | expo-av is sufficient for playback and simple recording. Use expo-av if 16kHz mono WAV is not required (e.g., just playing back Quran audio). For ASR pipelines, expo-av's preset system cannot reliably produce 16kHz mono WAV on both iOS and Android. |
| expo-sqlite + drizzle-orm | WatermelonDB | WatermelonDB is better if you need multi-table reactive queries at scale (10,000+ records with complex joins). For Quran data (6,236 ayahs, progress rows per user), expo-sqlite with drizzle useLiveQuery is sufficient and far simpler. |
| faster-whisper | openai/whisper (transformers pipeline) | openai/whisper is appropriate if you have ample VRAM (>8GB) and do not need quantization. On NVIDIA T4 (16GB VRAM shared across 3 models), faster-whisper's CTranslate2 int8 backend is necessary to fit all three models simultaneously. |
| Supabase Edge Functions (Deno) | Custom Node.js server for SM-2 | Use a separate Node.js server only if SM-2 logic becomes too complex for Deno's subset of Node APIs. Supabase Edge Functions run globally close to users, and SM-2 is simple arithmetic — no reason to run it on a separate server. |
| Zustand + TanStack Query | Redux Toolkit | Use Redux if your team has deep Redux expertise and needs Redux DevTools time-travel debugging. For a greenfield app, Zustand + TanStack Query delivers the same capabilities with 40% less bundle size and significantly less boilerplate. |
| React Native Skia (for Tajweed overlays) | Custom SVG per-word rendering | SVG-based rendering works but requires pre-rendering each word to an SVG node, which creates excessive memory pressure on long Surah pages. Skia draws directly to Canvas and is better suited for the animation and color-coding required in Tajweed drill mode. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| expo-av for ASR recording | `expo-av` uses preset recording configurations that cannot guarantee 16kHz mono PCM WAV output across both iOS and Android. ASR models trained on 16kHz mono will silently degrade in accuracy if fed 44.1kHz stereo audio. | `@mykin-ai/expo-audio-stream` — purpose-built for speech recognition pipelines, outputs 16kHz mono WAV natively |
| openai/whisper Python package for production | The original PyTorch Whisper implementation is 4-6x slower than faster-whisper and requires float32 computation, consuming the full T4 VRAM budget before the two wav2vec2 models can load. | `faster-whisper` with `compute_type="int8_float16"` |
| Supabase for GPU inference | Supabase Edge Functions run on Deno with no GPU access and a 2MB memory limit. PyTorch models are gigabytes. | FastAPI on EC2 g4dn.xlarge (NVIDIA T4) |
| React Navigation standalone (without Expo Router) | React Navigation works but requires manual deep link configuration, screen type declarations, and linking config. Expo Router handles all of this automatically via file-system convention. | Expo Router (which is built on React Navigation) |
| AsyncStorage for security-sensitive tokens | AsyncStorage is plain text on the filesystem. Readable on jailbroken/rooted devices. | `expo-secure-store` (iOS Keychain, Android Keystore) for refresh tokens and service keys |
| Redux Toolkit | Adds significant boilerplate for a greenfield app with no legacy Redux code. Overkill when Zustand handles client state and TanStack Query handles server state. | Zustand + TanStack Query |
| Local LLM inference on device | React Native has no stable, production-ready path for running Whisper or wav2vec2 on-device in 2026. ONNX Runtime Mobile and MediaPipe have coverage gaps and per-device debugging burden. | FastAPI on GPU EC2 — consistent accuracy, full Transformers ecosystem |
| Realm / MongoDB Atlas Device Sync | Heavyweight SDK for use case that expo-sqlite + Supabase Realtime sync covers fully. Adds a third backend dependency and vendor lock-in. | expo-sqlite + Supabase Realtime |
| Expo SDK 52 or 53 | Legacy Architecture support dropped in SDK 55. New Architecture (Bridgeless, JSI) is required for best performance on React Native 0.83. Using older SDK means missing Hermes v1 performance improvements and being on a path to forced upgrade. | Expo SDK 55 |

---

## Stack Patterns by Variant

**If recording is interrupted (app backgrounded mid-recitation):**
- Use `@mykin-ai/expo-audio-stream`'s offline queue: buffer audio chunks locally in expo-sqlite, upload when foregrounded
- Do NOT attempt to hold a network upload connection open in the background — iOS will terminate it

**If the EC2 GPU instance is unavailable (cold start, maintenance):**
- FastAPI should return HTTP 503 with `Retry-After` header
- Mobile client (TanStack Query) will retry automatically based on its retry/backoff config
- Show "AI feedback temporarily unavailable" UI state — do NOT block the user from recording and saving locally

**If riwayah is not Hafs:**
- All API endpoints, database rows, and mobile state must carry `riwayah` as an explicit string parameter (default `"hafs"`)
- The FastAPI server must reject requests with unsupported riwayah with HTTP 400 rather than silently using Hafs data
- This is the multi-riwayah architecture constraint from PROJECT.md — baked in from day one

**If Tajweed color-coding is needed on a surah page (not drill mode):**
- Use standard React Native Text with inline `<Text style={{ color }}> ` spans for word-level coloring
- Reserve `@shopify/react-native-skia` for drill mode where per-character glyph control is required
- Skia adds ~2MB to bundle; do not pull it in for simple word-level coloring

**If on-device spaced repetition scheduling is needed (offline):**
- SM-2 algorithm is pure arithmetic — implement it in TypeScript, not just in the Supabase Edge Function
- Run locally when offline, sync to Supabase when reconnected
- Store `next_review_date`, `interval`, `ease_factor`, `repetitions` in expo-sqlite `review_schedule` table

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| expo@55.x | react-native@0.83.x | Hermes v1 default; New Architecture only (no Legacy Architecture fallback) |
| expo-router@55.x | expo@55.x | Bundled together; do NOT mix expo-router with a different Expo SDK version |
| expo-sqlite@15.x | expo@55.x, drizzle-orm@^0.40.x | `drizzle.config.ts` must set `driver: 'expo'`; migrations must be bundled as string assets |
| @supabase/supabase-js@^2.x | react-native-url-polyfill@^2.x, @react-native-async-storage@^2.x | URL polyfill must be imported before Supabase client initialization; AsyncStorage adapter required |
| react-native-reanimated@^3.x | expo@55.x, react-native@0.83.x | SDK 55 ships reanimated 3.x compatible build; add `react-native-reanimated/plugin` to babel.config.js |
| faster-whisper@1.2.x | torch@2.5.x+cu121, Python@3.10+ | CUDA 12.1 build of PyTorch required; do not mix with CPU-only torch wheel |
| transformers@4.47.x | torch@2.5.x, accelerate@1.2.x | `accelerate` required for `device_map="auto"` multi-GPU or offloading; safe to install even on single-GPU |
| @mykin-ai/expo-audio-stream | expo@55.x | Community library; verify it has an SDK 55 release before upgrading Expo. Pin to tested version in package.json. |

---

## Sources

- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) — confirmed SDK 55 / React Native 0.83, New Architecture only, Hermes v1 (MEDIUM confidence — page loaded, confirmed)
- [Expo Router v55 Blog](https://expo.dev/blog/expo-router-v55-more-native-navigation-more-powerful-web) — confirmed expo-router version alignment (MEDIUM confidence)
- [Supabase Expo React Native Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native) — confirmed required polyfills and auth adapter pattern (HIGH confidence — official docs)
- [faster-whisper PyPI](https://pypi.org/project/faster-whisper/) — confirmed version 1.2.1 latest stable, October 2025 (HIGH confidence — official PyPI)
- [SYSTRAN/faster-whisper GitHub](https://github.com/SYSTRAN/faster-whisper) — int8_float16 compute_type for GPU, 4-6x speed improvement (HIGH confidence — official repo)
- [mykin-ai/expo-audio-stream GitHub](https://github.com/mykin-ai/expo-audio-stream) — 16kHz dual-stream output, purpose-built for ASR pipelines (MEDIUM confidence — official repo, community library)
- [Drizzle ORM Expo SQLite Docs](https://orm.drizzle.team/docs/connect-expo-sqlite) — useLiveQuery hook, expo driver, migration bundling (HIGH confidence — official docs)
- [FastAPI Server Workers Docs](https://fastapi.tiangolo.com/deployment/server-workers/) — Gunicorn + UvicornWorker production pattern (HIGH confidence — official docs)
- [Hugging Face Transformers Docs](https://huggingface.co/docs/transformers/model_doc/whisper) — torch_dtype, device_map, pipeline API (HIGH confidence — official docs)
- [tarteel-ai/whisper-base-ar-quran Hugging Face](https://huggingface.co/tarteel-ai/whisper-base-ar-quran) — model exists, 5.75% WER confirmed (MEDIUM confidence — model card)
- [React Native I18nManager Docs](https://reactnative.dev/docs/i18nmanager) — RTL layout support built into React Native Text (HIGH confidence — official docs)
- WebSearch: "Zustand TanStack Query React Native 2025" — Zustand + TanStack Query as standard state management pairing in 2025 (MEDIUM confidence — multiple corroborating articles)

---

*Stack research for: Quran Hifz & AI Recitation Correction Mobile App*
*Researched: 2026-03-04*

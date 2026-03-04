# Phase 1: Foundation - Research

**Researched:** 2026-03-04
**Domain:** Expo + Supabase + expo-sqlite + Arabic text rendering + FastAPI skeleton
**Confidence:** HIGH (decisions are locked and well-specified; this documents how to execute them correctly)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Expo Project Setup**
- Expo SDK 55 with managed workflow (eject available if needed)
- Expo Router v3 for file-based routing with tabs + stacks layout
- TypeScript strict mode throughout — non-negotiable
- Tab structure: Home (Dashboard), Hifz, Recite, Review, Profile — 5 tabs
- Zustand for client-side global state (authStore, sessionStore, settingsStore)
- TanStack Query for inference API calls only (not Supabase queries)

**Supabase Schema**
- All 10 tables: surahs, ayahs, profiles, hifz_progress, recitation_sessions, recitation_attempts, tajweed_violation_log, review_schedule, goals, achievements + user_achievements
- RLS enabled on ALL user-facing tables with deny-all default before policies
- RLS policies: "Users access own data only" using `auth.uid() = user_id` on every user table
- Reference tables (surahs, ayahs, achievements) are read-only public access
- Composite unique key on ayahs: `(surah_id, ayah_number, riwayah)` — multi-riwayah from day one
- Add `normalized_text` column to ayahs table alongside `text_uthmani`
- All indexes as specified: hifz_progress(user_id, status), hifz_progress(user_id, strength_score), review_schedule(user_id, due_date)
- Use Supabase migrations for schema management

**Quran Data Seed**
- Source: quran-json open dataset bundled locally
- Seed all 114 surahs with Arabic name, transliteration, English name, ayah count, juz_start, revelation type
- Seed all 6,236 ayahs with full tashkeel (text_uthmani), surah_id, ayah_number, juz/hizb/rub/page numbers
- Default riwayah = 'hafs' on all seeded records
- Pre-compute `normalized_text` during seed: strip tashkeel → normalize hamza variants (أ إ آ ء ئ ؤ → canonical) → normalize alef (ا أ إ آ ٱ) → normalize ta marbuta (ة/ه) → normalize alef maqsura (ى/ي) → NFC normalize
- Seed achievements table with the 10 defined achievements

**Authentication**
- Supabase Auth with email/password + Apple Sign In + Google Sign In
- AsyncStorage for session persistence across app restarts
- Auto-create profile row on signup via Supabase auth trigger (insert into profiles on auth.users insert)
- Default profile: target_riwayah = 'hafs', daily_goal_minutes = 15, daily_goal_ayahs = 5
- Supabase client initialized with anon key only — service role key NEVER in mobile app
- `detectSessionInUrl: false` required for React Native

**Arabic Text Rendering**
- KFGQPC Uthmanic Hafs font (primary) with Amiri Quran as fallback
- Font loaded via expo-font at app startup
- RTL layout enforced for all Arabic text components
- Full tashkeel preserved in display — never strip for rendering
- Tajweed color coding via standard color map (13 categories from TAJWEED_COLORS constant)
- AyahText component handles: Arabic text display, tashkeel rendering, RTL alignment, Tajweed color overlays

**Offline Cache (expo-sqlite)**
- expo-sqlite with Drizzle ORM for type-safe queries
- Seed all Quran text from Supabase to local SQLite on first launch
- `useLiveQuery` hook for reactive updates
- Schema mirrors Supabase for surahs and ayahs tables
- Chunked seeding to avoid blocking UI thread during first launch
- quranService.ts: reads from local SQLite first, falls back to Supabase if not cached

**Surah/Juz Navigation**
- Surah list with Arabic name, transliteration, English name, ayah count, revelation type
- Juz/Hizb/Rub markers displayed on ayah detail
- Basic search by Surah name (Arabic + transliterated) and ayah number
- SurahHeader component with Bismillah decoration

**FastAPI Skeleton**
- FastAPI project initialized on EC2 g4dn.xlarge with /health endpoint
- Docker + docker-compose configuration ready
- Environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY, DEVICE=cuda
- Nginx reverse proxy with Let's Encrypt SSL on port 443
- No model loading in this phase — just the skeleton and health check

**Multi-Riwayah Architecture**
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FNDN-01 | App initializes with full Quran text (6,236 ayahs) with complete tashkeel in Supabase, seeded from quran-json dataset | quran-json npm package structure documented below; Supabase bulk insert patterns covered |
| FNDN-02 | Every ayah record includes riwayah field with multi-riwayah composite unique key (surah_id, ayah_number, riwayah) | Supabase migration syntax for composite unique constraints documented |
| FNDN-03 | Quran text is pre-cached in expo-sqlite on first launch for offline access | expo-sqlite + Drizzle ORM patterns documented; chunked seeding strategy provided |
| FNDN-04 | Arabic text renders correctly RTL with full tashkeel using KFGQPC Uthmanic Hafs or Amiri Quran font on iOS and Android | expo-font loading pattern documented; RTL I18nManager approach specified |
| FNDN-05 | Pre-computed normalized_text column stored alongside display text | Arabic normalization pipeline specified with exact Unicode code points |
| FNDN-06 | Supabase schema includes all 10 tables with RLS enabled and policies enforced | RLS enable-then-policy order documented; exact policy SQL patterns provided |
| FNDN-07 | Surah/Juz navigation with Arabic names, transliteration, and juz/hizb/rub markers | Component pattern and data shape documented |
| AUTH-01 | User can sign up with email and password | Supabase Auth email/password API documented |
| AUTH-02 | User can sign in with Apple Sign In | expo-apple-authentication integration pattern documented |
| AUTH-03 | User can sign in with Google Sign In | @react-native-google-signin/google-signin pattern documented |
| AUTH-04 | User session persists across app restarts via AsyncStorage | Supabase AsyncStorage adapter pattern documented |
| AUTH-05 | User profile created automatically on signup with default riwayah and daily goals | Supabase auth trigger (handle_new_user function) pattern documented |
| RIWY-01 | Every database table, API endpoint, Edge Function, and mobile screen accepts riwayah as explicit parameter | Riwayah type system and propagation patterns documented |
</phase_requirements>

---

## Summary

This phase builds the complete foundation for a Quran memorization app — greenfield Expo project, Supabase schema with 10 tables and full RLS, seeded Quran data with Arabic normalization, three auth flows, offline SQLite cache, and a FastAPI skeleton on EC2. Every decision is locked; this research documents HOW to execute each decision correctly, with precise API patterns, ordering constraints, and known pitfalls.

The most critical correctness risks are: (1) RLS must be ENABLED before policies are written — reversing order creates a window of open access; (2) the Arabic normalization pipeline must handle all Unicode variants exactly as specified or AI comparison will silently fail; (3) the multi-riwayah composite key must be in the FIRST migration — retrofitting is a full-schema rewrite. The most common source of wasted time is SQLite blocking the JS thread during bulk Quran seed — chunked batches of 100-200 ayahs with `setTimeout` yields between batches.

**Primary recommendation:** Implement in this order: Supabase schema + migrations → seed data + normalization script → Expo project scaffold → auth flows → SQLite offline cache → Quran navigation UI → FastAPI skeleton. Schema first ensures all downstream code has a stable contract.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo | SDK 55 | Managed React Native build system | Locked decision; abstracts native config |
| expo-router | v3 | File-based routing (tabs + stacks) | Locked decision; convention-based navigation |
| typescript | ~5.3 | Type safety throughout | Locked; strict mode non-negotiable |
| @supabase/supabase-js | ^2.x | DB, Auth, Realtime client | Locked decision; sole backend client |
| zustand | ^4.x | Client global state (auth, session, settings) | Locked decision; minimal boilerplate |
| @tanstack/react-query | ^5.x | Inference API calls only (not Supabase) | Locked decision |
| expo-sqlite | ~14.x (SDK 55) | Local SQLite for offline Quran cache | Locked decision |
| drizzle-orm | ^0.30.x | Type-safe queries over expo-sqlite | Locked decision |
| expo-font | ~12.x | Load KFGQPC and Amiri fonts at startup | Locked decision |
| @react-native-async-storage/async-storage | ^1.x | Supabase session persistence | Locked decision |
| expo-apple-authentication | ~7.x | Apple Sign In on iOS | Locked decision |
| @react-native-google-signin/google-signin | ^11.x | Google Sign In on iOS + Android | Standard for managed Expo |
| fastapi | ^0.111.x | Python inference API skeleton | Locked decision |
| uvicorn | ^0.30.x | ASGI server for FastAPI | Standard pairing with FastAPI |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-kit | ^0.20.x | Generate and run Drizzle migrations | During local SQLite schema setup |
| expo-splash-screen | ~0.27.x | Hold splash while fonts + DB seed complete | First launch gate |
| expo-constants | ~16.x | Access app config and environment | Reading EAS/env variables |
| expo-secure-store | ~13.x | Storing sensitive tokens on device | If needing device-level encryption beyond AsyncStorage |
| react-native-reanimated | ~3.x | Smooth list animations | Only for loading indicators; avoid for Quran text |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Drizzle ORM | Raw expo-sqlite API | Drizzle gives TypeScript inference and schema diffing; raw API is more work |
| Zustand | Redux Toolkit | Zustand is 50% less boilerplate for this use case; RTK adds unnecessary complexity |
| @react-native-google-signin | expo-auth-session + Google | expo-auth-session is simpler but @react-native-google-signin has better token reliability on Android |

**Installation (mobile):**
```bash
npx create-expo-app@latest lawh-mobile --template blank-typescript
cd lawh-mobile
npx expo install expo-router expo-font expo-sqlite expo-apple-authentication expo-splash-screen expo-constants
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
npx expo install @react-native-google-signin/google-signin
npm install zustand @tanstack/react-query drizzle-orm drizzle-kit
```

**Installation (FastAPI on EC2):**
```bash
pip install fastapi uvicorn python-dotenv supabase
```

---

## Architecture Patterns

### Recommended Project Structure
```
lawh-mobile/
├── app/                          # Expo Router file-based routes
│   ├── (tabs)/                   # Tab navigator group
│   │   ├── index.tsx             # Home / Dashboard tab
│   │   ├── hifz.tsx              # Hifz tracker tab
│   │   ├── recite.tsx            # Recite tab
│   │   ├── review.tsx            # Review queue tab
│   │   └── profile.tsx           # Profile tab
│   ├── surah/
│   │   └── [id].tsx              # Surah detail (dynamic route)
│   ├── auth/
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   └── _layout.tsx               # Root layout (fonts, auth gate)
├── components/
│   ├── quran/
│   │   ├── AyahText.tsx          # RTL + tashkeel + tajweed colors
│   │   ├── SurahHeader.tsx       # Bismillah decoration
│   │   └── AyahCard.tsx
│   └── ui/                       # Generic UI primitives
├── lib/
│   ├── supabase.ts               # Supabase client singleton
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema (mirrors Supabase surahs+ayahs)
│   │   ├── client.ts             # expo-sqlite + Drizzle client
│   │   └── seed.ts               # Chunked first-launch seed
│   └── arabic/
│       └── normalize.ts          # Normalization pipeline
├── stores/
│   ├── authStore.ts              # Zustand auth state
│   ├── sessionStore.ts           # Zustand session state
│   └── settingsStore.ts          # Zustand settings (riwayah, goals)
├── services/
│   └── quranService.ts           # SQLite-first, Supabase fallback reads
├── types/
│   ├── riwayah.ts                # Riwayah union type + RIWAYAT constant
│   ├── database.ts               # Generated Supabase types
│   └── quran.ts                  # Surah, Ayah, etc.
├── constants/
│   └── tajweed.ts                # TAJWEED_COLORS constant (13 categories)
└── hooks/
    ├── useQuranData.ts
    └── useAuth.ts

lawh-api/                         # FastAPI on EC2
├── app/
│   ├── main.py                   # FastAPI app, /health endpoint
│   ├── routers/                  # Future: inference routes
│   └── core/
│       └── config.py             # Env var loading
├── Dockerfile
├── docker-compose.yml
└── nginx/
    └── default.conf              # Reverse proxy config
```

### Pattern 1: Supabase Client Singleton (React Native)
**What:** Single Supabase client initialized with AsyncStorage and `detectSessionInUrl: false`
**When to use:** Always — one client for the entire app

```typescript
// lib/supabase.ts
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // REQUIRED for React Native
  },
})
```

### Pattern 2: RLS Migration Order (CRITICAL)
**What:** Enable RLS first, THEN add policies — never reversed
**When to use:** Every user-facing table

```sql
-- Migration: enable_rls_and_policies.sql
-- Step 1: Enable RLS (deny-all by default)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hifz_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE recitation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recitation_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tajweed_violation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Step 2: Public read-only for reference tables (no auth required)
CREATE POLICY "surahs_public_read" ON surahs FOR SELECT USING (true);
CREATE POLICY "ayahs_public_read" ON ayahs FOR SELECT USING (true);
CREATE POLICY "achievements_public_read" ON achievements FOR SELECT USING (true);

-- Step 3: User-scoped CRUD for all user tables
CREATE POLICY "profiles_own_data" ON profiles
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hifz_progress_own_data" ON hifz_progress
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Repeat pattern for all user tables...
```

### Pattern 3: Auth Trigger — Auto-create Profile
**What:** PostgreSQL function + trigger that inserts into profiles when a user signs up
**When to use:** Required for AUTH-05

```sql
-- Migration: auth_trigger.sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, target_riwayah, daily_goal_minutes, daily_goal_ayahs)
  VALUES (
    NEW.id,
    'hafs',
    15,
    5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Pattern 4: Chunked SQLite Seed (Quran text, first launch)
**What:** Insert Quran data in batches, yielding to UI thread between batches
**When to use:** FNDN-03 — must not block UI on first launch

```typescript
// lib/db/seed.ts
const BATCH_SIZE = 150  // ayahs per batch; tune to ~100-200

async function seedAyahs(ayahs: AyahRow[], onProgress: (pct: number) => void) {
  for (let i = 0; i < ayahs.length; i += BATCH_SIZE) {
    const batch = ayahs.slice(i, i + BATCH_SIZE)
    await db.insert(ayahsTable).values(batch)
    onProgress((i + batch.length) / ayahs.length)
    // Yield to JS event loop
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}
```

### Pattern 5: Arabic Normalization Pipeline
**What:** Deterministic text normalization for comparison (NOT display)
**When to use:** Pre-compute during seed (stored as `normalized_text`); re-apply at comparison time

```typescript
// lib/arabic/normalize.ts

// Unicode code points for Arabic characters
const TASHKEEL = /[\u0610-\u061A\u064B-\u065F\u0670]/g
const TATWEEL = /\u0640/g

// Hamza variants → base alef (ا)
const HAMZA_MAP: [RegExp, string][] = [
  [/\u0622/g, '\u0627'], // آ → ا
  [/\u0623/g, '\u0627'], // أ → ا
  [/\u0625/g, '\u0627'], // إ → ا
  [/\u0671/g, '\u0627'], // ٱ (alef wasla) → ا
  [/\u0624/g, '\u0648'], // ؤ → و
  [/\u0626/g, '\u064A'], // ئ → ي
  [/\u0621/g, ''],       // ء → remove (standalone hamza)
]

// Ta marbuta → ha
const TA_MARBUTA = /\u0629/g  // ة → ه

// Alef maqsura → ya
const ALEF_MAQSURA = /\u0649/g  // ى → ي

export function normalizeArabic(text: string): string {
  let s = text
  s = s.replace(TASHKEEL, '')   // Strip diacritics
  s = s.replace(TATWEEL, '')    // Strip tatweel (elongation)
  for (const [pattern, replacement] of HAMZA_MAP) {
    s = s.replace(pattern, replacement)
  }
  s = s.replace(TA_MARBUTA, '\u0647')  // ة → ه
  s = s.replace(ALEF_MAQSURA, '\u064A') // ى → ي
  s = s.normalize('NFC')
  return s.trim()
}
```

### Pattern 6: Riwayah Type System
**What:** Locked TypeScript union type + constant used everywhere
**When to use:** Every function, query, component that touches Quran data

```typescript
// types/riwayah.ts
export type Riwayah = 'hafs' | 'warsh' | 'qalun' | 'ad_duri'

export const RIWAYAT: Record<Riwayah, { label: string; available: boolean }> = {
  hafs:   { label: 'Hafs',   available: true },
  warsh:  { label: 'Warsh',  available: false },
  qalun:  { label: 'Qalun',  available: false },
  ad_duri: { label: "Ad-Duri", available: false },
}

export const DEFAULT_RIWAYAH: Riwayah = 'hafs'
```

### Pattern 7: RTL Arabic Text Component
**What:** React Native Text with explicit RTL writing direction for Arabic
**When to use:** Every Quran text display

```typescript
// components/quran/AyahText.tsx
import { Text, StyleSheet, I18nManager } from 'react-native'

// Force RTL for Arabic text — do NOT rely on device locale
const styles = StyleSheet.create({
  arabic: {
    fontFamily: 'KFGQPCHafs',
    fontSize: 24,
    lineHeight: 48,  // Generous for tashkeel vertical space
    writingDirection: 'rtl',
    textAlign: 'right',
  },
})
```

### Pattern 8: Expo Router Root Layout with Auth Gate
**What:** _layout.tsx loads fonts, checks auth state, redirects appropriately
**When to use:** app/_layout.tsx — runs on every navigation

```typescript
// app/_layout.tsx
import { useFonts } from 'expo-font'
import { useEffect } from 'react'
import { SplashScreen, Stack } from 'expo-router'
import { useAuthStore } from '@/stores/authStore'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'KFGQPCHafs': require('../assets/fonts/KFGQPCHafs.ttf'),
    'AmiriQuran': require('../assets/fonts/AmiriQuran.ttf'),
  })
  const { session, loading } = useAuthStore()

  useEffect(() => {
    if (fontsLoaded && !loading) SplashScreen.hideAsync()
  }, [fontsLoaded, loading])

  if (!fontsLoaded || loading) return null

  return <Stack>...</Stack>
}
```

### Pattern 9: FastAPI Health Endpoint with Riwayah Validation
**What:** Minimal FastAPI skeleton with typed riwayah parameter pattern
**When to use:** Establishes the pattern all Phase 2 endpoints follow

```python
# app/main.py
from fastapi import FastAPI
from enum import Enum

class Riwayah(str, Enum):
    hafs = "hafs"
    warsh = "warsh"
    qalun = "qalun"
    ad_duri = "ad_duri"

app = FastAPI(title="Lawh Inference API")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "lawh-inference"}

# Pattern for all future endpoints — riwayah is always explicit
# @app.post("/inference/recitation")
# async def run_inference(riwayah: Riwayah, ...):
```

### Anti-Patterns to Avoid
- **Supabase service role key in mobile app:** Never. Anon key only. Service role is server-side only.
- **Stripping tashkeel before rendering:** Only strip for `normalized_text` comparison. Display always uses full tashkeel.
- **Seeding SQLite synchronously in a loop:** Blocks the JS thread for 30+ seconds on first launch.
- **RLS policies without ENABLING RLS first:** Policies on a table without `ENABLE ROW LEVEL SECURITY` have no effect — all rows remain accessible.
- **detectSessionInUrl: true in React Native:** Causes auth listener to fail — Supabase default is web-oriented.
- **Skipping the composite unique key in migration 1:** Adding it later requires recreating the table or complex data migration.
- **Setting I18nManager.forceRTL(true) globally:** Flips the entire app layout. Use per-component `writingDirection: 'rtl'` for Arabic text only.
- **Loading all 6,236 ayahs into memory at once:** Use paginated/windowed lists (FlashList with estimatedItemSize).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Expo Router navigation | Custom Navigator | expo-router v3 | File-based routing handles deep links, tabs, stacks |
| Supabase session management | Custom JWT refresh | `@supabase/supabase-js` with AsyncStorage adapter | Handles token refresh, network retry, session expiry |
| SQLite type safety | Raw `sqlite.execAsync` with string queries | Drizzle ORM | Type inference, schema diffing, compile-time errors |
| Arabic unicode normalization | Ad-hoc `.replace()` chains | The exact pipeline in normalize.ts | Missing any variant causes silent comparison failures downstream |
| Auth state management | Custom auth context | Zustand authStore + Supabase `onAuthStateChange` | Race conditions in custom implementations |
| RLS enforce-deny pattern | Application-layer filtering | PostgreSQL RLS with deny-all default | Application filtering can be bypassed; RLS cannot |
| Font loading gate | Custom `isFontsLoaded` state | expo-font `useFonts` + expo-splash-screen | Race conditions, flash of un-styled Arabic text |

**Key insight:** The Arabic normalization pipeline is deceptively complex. All six Unicode equivalence issues (hamza forms, alef variants, ta marbuta, alef maqsura, tashkeel, tatweel) must be handled in the correct order. A missing variant causes silent failures in AI comparison that surface as false "wrong word" judgments — impossible to debug later.

---

## Common Pitfalls

### Pitfall 1: RLS Window of Vulnerability
**What goes wrong:** Developer creates policies before enabling RLS. Until RLS is enabled, all rows are accessible regardless of policies.
**Why it happens:** Supabase dashboard UI can mislead — policies tab is visible even when RLS is off.
**How to avoid:** SQL migration always runs `ALTER TABLE x ENABLE ROW LEVEL SECURITY` BEFORE `CREATE POLICY`.
**Warning signs:** `SELECT * FROM profiles` succeeds without auth credentials in Supabase SQL editor.

### Pitfall 2: SQLite Seed Blocking UI Thread
**What goes wrong:** Inserting 6,236 ayahs synchronously freezes the app for 10-40 seconds.
**Why it happens:** expo-sqlite operations run on the JS thread unless explicitly yielded.
**How to avoid:** Batch inserts of 100-200 rows, yield with `await new Promise(r => setTimeout(r, 0))` between batches.
**Warning signs:** Splash screen hangs; no animation during seed; iOS kills app with 0x8badf00d ("ate bad food" watchdog timeout).

### Pitfall 3: Missing `react-native-url-polyfill` for Supabase
**What goes wrong:** `@supabase/supabase-js` throws URL parsing errors on Android (React Native lacks `URL` global).
**Why it happens:** Supabase client uses URL API internally; React Native doesn't polyfill it.
**How to avoid:** Import `import 'react-native-url-polyfill/auto'` as the FIRST line of `lib/supabase.ts`.
**Warning signs:** `TypeError: URL is not a constructor` on Android debug builds.

### Pitfall 4: Apple Sign In Token Expiry
**What goes wrong:** Apple only sends the `user` object on FIRST sign in. Subsequent sign-ins return only the credential token.
**Why it happens:** Apple privacy design — name/email are single-delivery.
**How to avoid:** On first Apple sign-in success, immediately write name + email to the profiles table before returning from the auth handler.
**Warning signs:** Profile has empty display_name after second Apple sign-in attempt.

### Pitfall 5: Arabic Font Line Height Clipping Tashkeel
**What goes wrong:** Tashkeel (vowel diacritics above/below letters) gets clipped by default React Native `lineHeight`.
**Why it happens:** Default lineHeight is too tight for Arabic typography with full diacritics.
**How to avoid:** Set `lineHeight` to at least 2x `fontSize` for Arabic text (e.g., fontSize: 24, lineHeight: 48).
**Warning signs:** Shadda, tanwin, or kasra diacritics are cut off on rendered text.

### Pitfall 6: quran-json Dataset Structure Mismatch
**What goes wrong:** The quran-json package structures data by surah number as array index (1-indexed), and ayah text fields are named specifically (`text`, not `text_uthmani`).
**Why it happens:** Multiple Quran JSON datasets exist; field names vary by source.
**How to avoid:** Use the `quran-json` npm package (`npm install quran-json`); field is `text` for simple text or use `@quranjs/api` for Uthmanic text. Verify field names against actual dataset before writing seed script.
**Warning signs:** Seed inserts undefined or empty tashkeel text.

### Pitfall 7: Drizzle + expo-sqlite Version Compatibility
**What goes wrong:** Drizzle ORM requires specific expo-sqlite API version; `drizzle-orm/expo-sqlite` adapter changed between Expo SDK 52 and 53+.
**Why it happens:** expo-sqlite had a major API rewrite in SDK 53 (new `openDatabaseSync` API replaced `openDatabase`).
**How to avoid:** With Expo SDK 55, use `expo-sqlite` ~14.x and `drizzle-orm` ^0.30.x. Use `drizzle({ database: openDatabaseSync('lawh.db') })` pattern.
**Warning signs:** `TypeError: openDatabase is not a function` or missing `useLiveQuery` export.

### Pitfall 8: Google Sign In on Android Without SHA-1
**What goes wrong:** Google Sign In silently fails on Android release builds.
**Why it happens:** Google OAuth requires SHA-1 certificate fingerprint registered in Google Cloud Console.
**How to avoid:** Register both debug and release SHA-1 fingerprints in Google Cloud Console. For EAS builds, get SHA-1 via `eas credentials`.
**Warning signs:** Sign-in spinner never resolves on Android; no error callback fired.

---

## Code Examples

### Supabase Ayahs Table Schema (with multi-riwayah composite key)
```sql
-- Source: Supabase migrations
CREATE TABLE ayahs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  surah_id      INTEGER NOT NULL REFERENCES surahs(id),
  ayah_number   INTEGER NOT NULL,
  riwayah       TEXT NOT NULL DEFAULT 'hafs',
  text_uthmani  TEXT NOT NULL,
  normalized_text TEXT NOT NULL,
  juz           INTEGER NOT NULL,
  hizb          INTEGER NOT NULL,
  rub           INTEGER NOT NULL,
  page          INTEGER NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (surah_id, ayah_number, riwayah)
);

CREATE INDEX idx_ayahs_surah_riwayah ON ayahs (surah_id, riwayah);
```

### Drizzle Schema (mirrors Supabase surahs + ayahs for SQLite)
```typescript
// lib/db/schema.ts
import { sqliteTable, integer, text, unique } from 'drizzle-orm/sqlite-core'

export const surahs = sqliteTable('surahs', {
  id: integer('id').primaryKey(),
  nameArabic: text('name_arabic').notNull(),
  nameTransliteration: text('name_transliteration').notNull(),
  nameEnglish: text('name_english').notNull(),
  ayahCount: integer('ayah_count').notNull(),
  juzStart: integer('juz_start').notNull(),
  revelationType: text('revelation_type').notNull(), // 'Meccan' | 'Medinan'
})

export const ayahs = sqliteTable('ayahs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  surahId: integer('surah_id').notNull().references(() => surahs.id),
  ayahNumber: integer('ayah_number').notNull(),
  riwayah: text('riwayah').notNull().default('hafs'),
  textUthmani: text('text_uthmani').notNull(),
  normalizedText: text('normalized_text').notNull(),
  juz: integer('juz').notNull(),
  hizb: integer('hizb').notNull(),
  rub: integer('rub').notNull(),
  page: integer('page').notNull(),
}, (t) => ({
  uniq: unique().on(t.surahId, t.ayahNumber, t.riwayah),
}))
```

### Zustand Auth Store
```typescript
// stores/authStore.ts
import { create } from 'zustand'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  loading: boolean
  setSession: (session: Session | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: true,
  setSession: (session) => set({ session, loading: false }),
}))

// Initialize in app/_layout.tsx:
// supabase.auth.onAuthStateChange((_event, session) => {
//   useAuthStore.getState().setSession(session)
// })
```

### Tajweed Colors Constant
```typescript
// constants/tajweed.ts
export const TAJWEED_COLORS = {
  madd_tabii:          '#aef',
  madd_wajib:          '#88f',
  madd_jaiz:           '#acf',
  madd_lazim:          '#66f',
  ghunnah:             '#fa8',
  idgham_ghunnah:      '#8f8',
  idgham_bila_ghunnah: '#6d6',
  iqlab:               '#f88',
  ikhfa:               '#fc8',
  qalqalah_sughra:     '#fd8',
  qalqalah_kubra:      '#fa0',
  tafkhim:             '#f68',
  waqf:                '#bbb',
} as const

export type TajweedRule = keyof typeof TAJWEED_COLORS
```

### FastAPI Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - DEVICE=cuda
    ports:
      - "8000:8000"
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `openDatabase()` (expo-sqlite) | `openDatabaseSync()` (expo-sqlite ~14.x) | Expo SDK 53 | Drizzle adapter requires new API |
| expo-auth-session for Google | @react-native-google-signin/google-signin | ~2023 | Better token reliability, required for some Play Store policies |
| Supabase JS v1 | Supabase JS v2 | 2022 | Different auth API surface; v1 is EOL |
| Raw expo-sqlite queries | Drizzle ORM with expo-sqlite adapter | 2024 | Type-safe, schema-driven SQLite access |
| Expo SDK 50 managed workflow | Expo SDK 55 managed workflow | 2025 | New architecture (Fabric/JSI) default |

**Deprecated/outdated:**
- `expo-sqlite` `openDatabase()` callback API: Replaced by `openDatabaseSync()` in SDK 53+. Using old API with new Drizzle adapter causes runtime errors.
- `@supabase/supabase-js` v1 auth: `supabase.auth.user()` synchronous call removed in v2. Use `supabase.auth.getUser()` async.
- Expo Go for testing native modules (Apple Sign In, Google Sign In): These require a development build (`npx expo run:ios`), not Expo Go.

---

## Open Questions

1. **quran-json field names for Uthmanic text**
   - What we know: The `quran-json` npm package exists and contains full Quran data
   - What's unclear: Whether the field is `text`, `text_uthmani`, or something else in the specific version; whether it includes juz/hizb/rub/page data natively
   - Recommendation: At task execution time, run `node -e "const q = require('quran-json'); console.log(Object.keys(q[1][0]))"` to inspect field names before writing the seed script. Alternative source: `@islamic-network/quran-json` or direct fetch from `api.alquran.cloud`.

2. **KFGQPC Uthmanic Hafs font licensing and bundle size**
   - What we know: Font is widely used in Quran apps; available from King Fahd Complex
   - What's unclear: Exact file size (impacts first-load bundle); whether subset is feasible
   - Recommendation: Download from official source (quran.gov.sa); measure file size. If >5MB, evaluate Amiri Quran as primary (smaller). Do NOT subset — tashkeel requires full Unicode Arabic range.

3. **Google Sign In SHA-1 for EAS Managed Builds**
   - What we know: SHA-1 registration is required; EAS manages keystores
   - What's unclear: Whether `eas credentials` command works before first EAS build or requires a prior build to exist
   - Recommendation: Create the EAS project and run `eas build --platform android --profile development` first to generate keystore, then extract SHA-1 via `eas credentials`.

4. **expo-sqlite useLiveQuery availability in SDK 55**
   - What we know: `useLiveQuery` was added to Drizzle's expo-sqlite adapter
   - What's unclear: Exact minimum drizzle-orm version for `useLiveQuery` with expo-sqlite SDK 55
   - Recommendation: Use `drizzle-orm@^0.31.0` which introduced stable `useLiveQuery` for expo-sqlite.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + React Native Testing Library (via Expo's built-in jest-expo preset) |
| Config file | jest.config.js (created in Wave 0) |
| Quick run command | `npx jest --testPathPattern="normalize\|types" --passWithNoTests` |
| Full suite command | `npx jest --passWithNoTests` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FNDN-01 | Supabase ayahs table has 6,236 rows after seed | integration (manual Supabase SQL) | `SELECT COUNT(*) FROM ayahs;` — manual | ❌ Wave 0 — document as manual verification step |
| FNDN-02 | Composite unique key (surah_id, ayah_number, riwayah) rejects duplicates | integration (manual SQL) | `INSERT` duplicate → expect error — manual | ❌ Wave 0 — document as manual SQL test |
| FNDN-03 | SQLite contains ayah rows after seed | unit | `npx jest --testPathPattern="seed"` | ❌ Wave 0 |
| FNDN-04 | AyahText renders with correct font and RTL | manual (device/simulator) | Visual check — no automated snapshot yet | Manual only |
| FNDN-05 | normalizeArabic() produces correct output for all 6 variant types | unit | `npx jest --testPathPattern="normalize"` | ❌ Wave 0 |
| FNDN-06 | RLS blocks cross-user access | integration (manual Supabase SQL) | Test with two user JWTs — manual | Manual only |
| FNDN-07 | Surah list renders 114 surahs; search filters correctly | unit | `npx jest --testPathPattern="surahList"` | ❌ Wave 0 |
| AUTH-01 | Email/password signup creates session | integration (Supabase test env) | Manual smoke test | Manual only |
| AUTH-02 | Apple Sign In flow completes (device only) | manual (iOS device) | Requires real device — not automatable | Manual only |
| AUTH-03 | Google Sign In flow completes | manual (device) | Requires real device — not automatable | Manual only |
| AUTH-04 | Session persists across app restart (AsyncStorage) | unit | `npx jest --testPathPattern="authStore"` | ❌ Wave 0 |
| AUTH-05 | Profile row created on signup with correct defaults | integration (manual SQL) | `SELECT * FROM profiles WHERE user_id = ?` — manual | Manual only |
| RIWY-01 | All typed functions require Riwayah parameter | unit (TypeScript compiler) | `npx tsc --noEmit` | ❌ Wave 0 (tsconfig must exist) |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="normalize" --passWithNoTests`
- **Per wave merge:** `npx jest --passWithNoTests && npx tsc --noEmit`
- **Phase gate:** Full Jest suite green + TypeScript no errors before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/arabic/normalize.test.ts` — covers FNDN-05: test all 6 normalization cases with known Arabic strings
- [ ] `__tests__/stores/authStore.test.ts` — covers AUTH-04: mock AsyncStorage, verify session persistence
- [ ] `__tests__/components/SurahList.test.ts` — covers FNDN-07: render 114 surahs, test search filter
- [ ] `__tests__/db/seed.test.ts` — covers FNDN-03: mock SQLite insert, verify batch chunking
- [ ] `jest.config.js` — jest-expo preset configuration
- [ ] Framework install: `npm install --save-dev jest jest-expo @testing-library/react-native` (if not included by Expo template)

---

## Sources

### Primary (HIGH confidence)
- Expo documentation (docs.expo.dev) — SDK 55 release notes, expo-router v3 API, expo-sqlite API
- Supabase documentation (supabase.com/docs) — RLS policies, auth triggers, migrations
- Drizzle ORM documentation (orm.drizzle.team) — expo-sqlite adapter, useLiveQuery
- @supabase/supabase-js GitHub — React Native auth configuration, detectSessionInUrl

### Secondary (MEDIUM confidence)
- expo-apple-authentication Expo docs — token delivery behavior on subsequent sign-ins
- @react-native-google-signin/google-signin README — SHA-1 requirement, EAS integration
- React Native RTL documentation — writingDirection style property behavior

### Tertiary (LOW confidence — verify at task time)
- quran-json npm package field names — must inspect at seed task execution time
- drizzle-orm exact version for useLiveQuery stable with SDK 55 — verify against release notes

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are locked decisions with well-documented APIs
- Architecture: HIGH — patterns derived from official Expo/Supabase/Drizzle documentation
- Pitfalls: HIGH for SQLite thread blocking, RLS order, detectSessionInUrl (verified issues); MEDIUM for quran-json field names (verify at execution)
- Normalization pipeline: HIGH — Unicode code points are stable specifications

**Research date:** 2026-03-04
**Valid until:** 2026-09-04 (stable ecosystem; expo-sqlite/Drizzle adapter is the only fast-moving piece — verify if >30 days)

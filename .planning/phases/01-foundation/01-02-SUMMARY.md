---
phase: 01-foundation
plan: 02
subsystem: ui
tags: [expo, react-native, expo-router, supabase, zustand, tanstack-query, typescript]

# Dependency graph
requires:
  - phase: 01-foundation-01
    provides: "Riwayah/Quran TypeScript types used by settingsStore"
provides:
  - "Expo SDK 55 project with TypeScript strict mode"
  - "Supabase client singleton with AsyncStorage auth persistence"
  - "Three Zustand stores: authStore, settingsStore, sessionStore"
  - "5-tab Expo Router layout with auth gate"
  - "Auth screen placeholders (sign-in, sign-up)"
  - "Jest + jest-expo test configuration"
affects: [01-foundation-04, 01-foundation-05, 01-foundation-06]

# Tech tracking
tech-stack:
  added: [expo-router, expo-font, expo-sqlite, expo-splash-screen, expo-constants, expo-secure-store, expo-apple-authentication, "@react-native-google-signin/google-signin", "@supabase/supabase-js", "@react-native-async-storage/async-storage", react-native-url-polyfill, zustand, "@tanstack/react-query", drizzle-orm, drizzle-kit, jest-expo, "@testing-library/react-native"]
  patterns: ["Supabase client with detectSessionInUrl: false for RN", "Zustand store per domain (auth, settings, session)", "Auth gate pattern via useSegments + useRouter", "expo-router file-based routing with (tabs) group"]

key-files:
  created: [lawh-mobile/lib/supabase.ts, lawh-mobile/stores/authStore.ts, lawh-mobile/stores/settingsStore.ts, lawh-mobile/stores/sessionStore.ts, lawh-mobile/app/_layout.tsx, "lawh-mobile/app/(tabs)/_layout.tsx", lawh-mobile/app/auth/sign-in.tsx, lawh-mobile/app/auth/sign-up.tsx]
  modified: [lawh-mobile/package.json, lawh-mobile/app.json, lawh-mobile/tsconfig.json, lawh-mobile/jest.config.js]

key-decisions:
  - "Deferred font loading (KFGQPCHafs, AmiriQuran) with placeholder const fontsLoaded = true until font files are downloaded"
  - "Switched entry point from App.tsx to expo-router/entry for file-based routing"
  - "expo install auto-added expo-font, expo-sqlite, expo-secure-store to app.json plugins array"

patterns-established:
  - "Auth gate: useAuthStore + useSegments to redirect unauthenticated users to /auth/sign-in"
  - "Supabase singleton: import url-polyfill first, AsyncStorage adapter, detectSessionInUrl: false"
  - "Store pattern: one Zustand store per domain with typed interface"
  - "Screen placeholder: View + Text + StyleSheet for screens to be implemented later"

requirements-completed: [FNDN-04]

# Metrics
duration: 6min
completed: 2026-03-04
---

# Phase 1 Plan 02: Expo Mobile Scaffold Summary

**Expo SDK 55 project with expo-router tabs, Supabase client singleton, three Zustand stores, and auth gate routing**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-04T22:50:01Z
- **Completed:** 2026-03-04T22:56:32Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments
- Scaffolded Expo SDK 55 project with all 17 required dependencies installed and TypeScript strict mode
- Created Supabase client singleton with AsyncStorage persistence and detectSessionInUrl: false
- Built 5-tab navigation layout (Home, Hifz, Recite, Review, Profile) with auth gate redirecting unauthenticated users
- Set up three Zustand stores (auth, settings, session) with typed interfaces

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Expo project and install all dependencies** - `fe7c9c9` (feat)
2. **Task 2: Supabase client, Zustand stores, and Expo Router layout** - `a7dabca` (feat)

## Files Created/Modified
- `lawh-mobile/package.json` - All dependencies (expo modules, supabase, zustand, drizzle, testing)
- `lawh-mobile/app.json` - Expo config with lawh scheme, Apple/Google Sign In plugins, typed routes
- `lawh-mobile/tsconfig.json` - TypeScript strict mode with @/* path aliases
- `lawh-mobile/jest.config.js` - Jest with jest-expo preset and module name mapping
- `lawh-mobile/.env.example` - Supabase URL and anon key template
- `lawh-mobile/lib/supabase.ts` - Supabase singleton with AsyncStorage and detectSessionInUrl: false
- `lawh-mobile/stores/authStore.ts` - Auth state: session, loading, setSession
- `lawh-mobile/stores/settingsStore.ts` - Settings: riwayah, daily goals
- `lawh-mobile/stores/sessionStore.ts` - Active recitation session tracking
- `lawh-mobile/app/_layout.tsx` - Root layout with auth gate, splash screen, QueryClientProvider
- `lawh-mobile/app/(tabs)/_layout.tsx` - 5-tab navigator
- `lawh-mobile/app/(tabs)/{index,hifz,recite,review,profile}.tsx` - Tab screen placeholders
- `lawh-mobile/app/auth/{sign-in,sign-up}.tsx` - Auth screen placeholders
- `lawh-mobile/app/surah/[id].tsx` - Surah detail placeholder
- `lawh-mobile/assets/fonts/FONTS_README.md` - Font download instructions

## Decisions Made
- Deferred font loading: KFGQPCHafs.ttf and AmiriQuran.ttf not yet downloaded; _layout.tsx uses `const fontsLoaded = true` placeholder with TODO comment to enable useFonts once fonts are present
- Removed default App.tsx and index.ts entry point in favor of expo-router/entry (package.json main field)
- Accepted expo install auto-adding expo-font, expo-sqlite, expo-secure-store to app.json plugins (harmless, enables native module config)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Switched entry point from App.tsx to expo-router/entry**
- **Found during:** Task 2 (Expo Router layout creation)
- **Issue:** Default create-expo-app template uses App.tsx with registerRootComponent, but expo-router requires "expo-router/entry" as main field in package.json
- **Fix:** Changed package.json main to "expo-router/entry", deleted App.tsx and index.ts
- **Files modified:** lawh-mobile/package.json, lawh-mobile/App.tsx (deleted), lawh-mobile/index.ts (deleted)
- **Verification:** npx tsc --noEmit passes cleanly
- **Committed in:** a7dabca (Task 2 commit)

**2. [Rule 3 - Blocking] Testing library peer dependency conflict**
- **Found during:** Task 1 (dependency installation)
- **Issue:** @testing-library/react-native had peer dependency conflicts with react-native 0.83
- **Fix:** Used --legacy-peer-deps flag for testing library installation
- **Files modified:** lawh-mobile/package-lock.json
- **Verification:** All packages installed successfully
- **Committed in:** fe7c9c9 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for expo-router compatibility and dependency resolution. No scope creep.

## Issues Encountered
- Previous plan 01-01 had already partially scaffolded the lawh-mobile directory with package.json and some deps; create-expo-app ran over the existing directory but did not overwrite package.json. Installed missing expo modules via npx expo install separately.

## User Setup Required

Font files must be downloaded manually before Arabic text rendering is available:
1. Download `KFGQPCHafs.ttf` from https://quran.gov.sa
2. Download `AmiriQuran.ttf` from https://github.com/aliftype/amiri
3. Place both in `lawh-mobile/assets/fonts/`
4. Uncomment the `useFonts` call in `app/_layout.tsx`

## Next Phase Readiness
- Expo project fully scaffolded and ready for UI plans (04, 05, 06)
- Auth screens are placeholders awaiting plan 01-04 (Auth flow implementation)
- Tab screens are placeholders awaiting plans 01-05 and 01-06
- Font files need to be downloaded before Phase 1 is considered complete

## Self-Check: PASSED

All 13 created files verified present. Both task commits (fe7c9c9, a7dabca) verified in git log.

---
*Phase: 01-foundation*
*Completed: 2026-03-04*

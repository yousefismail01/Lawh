---
phase: 01-foundation
plan: 09
subsystem: ui
tags: [arabic-fonts, quran, expo-font, ttf, uthmanic-hafs, amiri]

# Dependency graph
requires:
  - phase: 01-foundation-02
    provides: "App layout with font loading placeholder"
provides:
  - "KFGQPCHafs.ttf - KFGQPC Uthmanic Script HAFS font for Quran text"
  - "AmiriQuran.ttf - Amiri Quran fallback font"
  - "Real font loading via useFonts() in root layout"
affects: [01-foundation-06, quran-display, arabic-rendering]

# Tech tracking
tech-stack:
  added: [expo-font]
  patterns: [useFonts-hook-in-root-layout]

key-files:
  created:
    - lawh-mobile/assets/fonts/KFGQPCHafs.ttf
    - lawh-mobile/assets/fonts/AmiriQuran.ttf
  modified:
    - lawh-mobile/app/_layout.tsx

key-decisions:
  - "Used UthmanicHafs1Ver18 from quran.com official repo as KFGQPCHafs -- same King Fahd Complex font, verified digitally signed"

patterns-established:
  - "Font loading: useFonts() in RootLayout gates SplashScreen.hideAsync()"

requirements-completed: [FNDN-04]

# Metrics
duration: 3min
completed: 2026-03-04
---

# Phase 1 Plan 9: Arabic Fonts Gap Closure Summary

**KFGQPC Uthmanic Hafs and Amiri Quran fonts downloaded with real useFonts() loading replacing hardcoded bypass**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-04T23:27:11Z
- **Completed:** 2026-03-04T23:29:45Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Downloaded valid KFGQPCHafs.ttf (242KB, digitally signed, King Fahd Complex) and AmiriQuran.ttf (168KB, OFL licensed)
- Restored useFonts() hook in _layout.tsx replacing `const fontsLoaded = true` bypass
- Splash screen correctly waits for fonts to load before rendering app content

## Task Commits

Each task was committed atomically:

1. **Task 1: Download Arabic font files** - `b01219a` (feat)
2. **Task 2: Restore useFonts() in _layout.tsx** - `06e01ad` (feat)

## Files Created/Modified
- `lawh-mobile/assets/fonts/KFGQPCHafs.ttf` - KFGQPC Uthmanic Script HAFS font (242KB, digitally signed)
- `lawh-mobile/assets/fonts/AmiriQuran.ttf` - Amiri Quran Regular font (168KB, OFL licensed)
- `lawh-mobile/app/_layout.tsx` - Added useFonts import from expo-font, replaced bypass with actual font loading

## Decisions Made
- Used UthmanicHafs1Ver18.ttf from quran/quran.com-frontend-next official repo as the KFGQPCHafs font -- this is the same King Fahd Complex Uthmanic Script HAFS font (digitally signed, copyright 2010), sourced from a trusted and maintained repository

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] KFGQPCHafs.ttf was a 63-byte placeholder, not a real font**
- **Found during:** Task 1 (Download Arabic font files)
- **Issue:** The existing KFGQPCHafs.ttf in assets/fonts/ was only 63 bytes of ASCII text -- a placeholder, not a valid TrueType font
- **Fix:** Downloaded the real UthmanicHafs1Ver18.ttf (242KB) from the quran.com official frontend repository
- **Files modified:** lawh-mobile/assets/fonts/KFGQPCHafs.ttf
- **Verification:** `file` command confirms TrueType Font data, digitally signed, 17 tables
- **Committed in:** b01219a (Task 1 commit)

**2. [Rule 3 - Blocking] Primary download URL (AhmedAlyEl-Ghannam/QuranFonts) returned 404**
- **Found during:** Task 1 (Download Arabic font files)
- **Issue:** The plan's primary and CDN URLs for KFGQPCHafs.ttf all returned 404/HTML pages -- the repo does not exist
- **Fix:** Searched GitHub API, found the font in the official quran.com-frontend-next repository under public/fonts/quran/hafs/uthmanic_hafs/
- **Files modified:** lawh-mobile/assets/fonts/KFGQPCHafs.ttf
- **Verification:** Valid TTF, correct file size, correct font metadata
- **Committed in:** b01219a (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both auto-fixes necessary -- placeholder file and broken URLs would have prevented font loading. No scope creep.

## Issues Encountered
- Pre-existing TS error in _layout.tsx (router.replace argument type mismatch for "/(tabs)/") is unrelated to font changes -- not addressed per scope boundary rules

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Arabic Quran text will now render in Uthmanic script with full tashkeel support
- Font loading gates splash screen -- app waits for fonts before rendering
- Ready for Phase 2 work requiring proper Arabic text display

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 01-foundation*
*Completed: 2026-03-04*

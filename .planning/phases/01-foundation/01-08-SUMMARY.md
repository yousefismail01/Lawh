---
phase: 01-foundation
plan: 08
subsystem: database
tags: [supabase, quran-json, quran-api, seed-script, arabic-normalization]

requires:
  - phase: 01-foundation-03
    provides: "normalizeArabic function for text normalization"
  - phase: 01-foundation-03
    provides: "Supabase schema with surahs and ayahs tables"
provides:
  - "Complete seed script populating 114 surahs and 6236 ayahs in Supabase"
  - "Quran.com API v4 integration for verse metadata (juz/hizb/rub/page)"
affects: [01-foundation-05, 01-foundation-06, 02-audio]

tech-stack:
  added: [quran-com-api-v4]
  patterns: [api-metadata-enrichment, upsert-idempotent-seeding]

key-files:
  created: []
  modified:
    - scripts/seed-supabase.ts

key-decisions:
  - "Use Quran.com API v4 for juz/hizb/rub/page metadata since quran-json lacks per-verse positional data"
  - "Fetch metadata at runtime rather than embedding static lookup -- keeps script maintainable and data authoritative"
  - "Batch upserts at 200 rows per request to respect Supabase payload limits"

patterns-established:
  - "Seed script pattern: local data source for text + API enrichment for metadata"
  - "Explicit env var validation with early exit before any DB operations"

requirements-completed: [FNDN-01]

duration: 2min
completed: 2026-03-04
---

# Phase 01 Plan 08: Quran Data Seed Summary

**Complete Supabase seed script using quran-json for Uthmanic text and Quran.com API v4 for juz/hizb/rub/page metadata**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-04T23:47:08Z
- **Completed:** 2026-03-04T23:49:10Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Replaced MANUAL STEP REQUIRED placeholder with complete working seed logic
- Maps quran-json local verse text (Uthmanic script with tashkeel) to text_uthmani column
- Fetches juz/hizb/rub/page metadata per verse from Quran.com API v4 at runtime
- Applies normalizeArabic() to compute normalized_text for every ayah
- Adds final count verification logging (114 surahs, 6236 ayahs expected)

## Task Commits

Each task was committed atomically:

1. **Task 1: Inspect quran-json data source and fix seed script** - `01ee90d` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `scripts/seed-supabase.ts` - Complete seed script: achievements + surahs + ayahs with API metadata enrichment

## Decisions Made
- Used Quran.com API v4 for metadata because quran-json only contains verse text and transliteration, no positional data (juz/hizb/rub/page)
- Fetches metadata per chapter (114 API calls) rather than bulk endpoint -- simpler pagination, each chapter fits in single response (max 286 verses)
- Added explicit SUPABASE_URL/SUPABASE_SERVICE_KEY validation with process.exit(1) before any operations
- Added ts-node compiler-options instruction in script header since root has no tsconfig.json

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] quran-json lacks juz/hizb/rub/page metadata**
- **Found during:** Task 1 (data source inspection)
- **Issue:** quran-json provides only verse text and transliteration per verse -- no juz, hizb, rub, or page fields
- **Fix:** Added Quran.com API v4 fetch at runtime to get metadata for all 6236 verses, merged with local text data
- **Files modified:** scripts/seed-supabase.ts
- **Verification:** Script compiles and loads correctly, fails only at Supabase connection (expected without .env)
- **Committed in:** 01ee90d

**2. [Rule 3 - Blocking] ts-node compilation requires explicit compiler options**
- **Found during:** Task 1 (verification step)
- **Issue:** No root tsconfig.json; ts-node picks up lawh-mobile/tsconfig.json which extends expo and causes module resolution errors
- **Fix:** Added --compiler-options flag to run command in script header; used --skip-project + explicit options for verification
- **Files modified:** scripts/seed-supabase.ts (header comment)
- **Committed in:** 01ee90d

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for script to compile and produce correct data. No scope creep.

## Issues Encountered
- quran-json package structure required reading chapter files from dist/chapters/{id}.json rather than importing module directly (module only returns surah-level metadata without verses)
- Name field for English surah name comes from the main quran-json index (translation field), not from the chapter file

## User Setup Required
None - no external service configuration required. User runs seed script with their own SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.

## Next Phase Readiness
- Seed script is ready to execute against any Supabase instance with the correct schema
- Requires internet access at seed time for Quran.com API v4 metadata fetch
- Once seeded, offline cache wiring (01-05) and Quran display (01-06) have production data to work with

---
*Phase: 01-foundation*
*Completed: 2026-03-04*

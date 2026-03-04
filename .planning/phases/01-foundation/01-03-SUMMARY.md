---
phase: 01-foundation
plan: 03
subsystem: database
tags: [typescript, arabic, unicode, normalization, drizzle, sqlite, supabase, seed]

# Dependency graph
requires:
  - phase: 01-01
    provides: Supabase schema with surahs/ayahs/achievements tables, TypeScript types
provides:
  - normalizeArabic() function for Arabic text comparison (strip tashkeel, normalize hamza/alef/ta-marbuta/alef-maqsura, NFC)
  - Drizzle SQLite schema mirroring Supabase surahs+ayahs
  - Chunked first-launch SQLite seed function with progress callback
  - One-time Supabase seed script for 10 achievements + Quran data placeholder
affects: [01-04, 01-05, 01-06, 01-07, 02-01, 02-02]

# Tech tracking
tech-stack:
  added: [dotenv]
  patterns: [TDD for Arabic normalization, chunked SQLite batch insert with setTimeout yield, NFC Unicode normalization]

key-files:
  created:
    - lawh-mobile/lib/arabic/normalize.ts
    - lawh-mobile/__tests__/arabic/normalize.test.ts
    - lawh-mobile/lib/db/schema.ts
    - lawh-mobile/lib/db/client.ts
    - lawh-mobile/lib/db/seed.ts
    - scripts/seed-supabase.ts
    - scripts/.env.example
    - .gitignore
  modified: []

key-decisions:
  - "Arabic normalization strips tashkeel first, then normalizes character variants, then NFC -- order matters for correctness"
  - "Standalone hamza removed entirely (not mapped to alef) per Uthmanic orthography comparison needs"
  - "Supabase seed script uses placeholder Quran mapping requiring manual field name inspection before execution"

patterns-established:
  - "Arabic normalization: NEVER use normalizeArabic for display, only for comparison operations"
  - "SQLite seed: chunked BATCH_SIZE=150 with setTimeout(0) yield between batches to avoid watchdog timeout"
  - "Seed scripts: service role key via dotenv, never committed, .env.example for documentation"

requirements-completed: [FNDN-01, FNDN-02, FNDN-05]

# Metrics
duration: 2min
completed: 2026-03-04
---

# Phase 1 Plan 03: Arabic Normalization and Data Seed Summary

**normalizeArabic() pipeline with 12 passing tests covering all 6 Unicode equivalence classes, Drizzle SQLite schema, and Supabase seed infrastructure**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-04T22:59:12Z
- **Completed:** 2026-03-04T23:01:31Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- normalizeArabic() handles tashkeel stripping, hamza/alef variant normalization, ta marbuta, alef maqsura, tatweel removal, and NFC normalization with 12 passing tests
- Drizzle SQLite schema mirrors Supabase with UNIQUE constraint on (surah_id, ayah_number, riwayah) for multi-riwayah support
- Chunked SQLite seed with BATCH_SIZE=150 and setTimeout yield for smooth first-launch experience
- Supabase seed script with all 10 achievement definitions and placeholder Quran data mapping

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Arabic normalization tests** - `e78ca46` (test)
2. **Task 1 (GREEN): Arabic normalization implementation** - `833ea1e` (feat)
3. **Task 2: Drizzle schema, seed infrastructure, Supabase seed script** - `405f9a9` (feat)

## Files Created/Modified
- `lawh-mobile/lib/arabic/normalize.ts` - normalizeArabic() function with tashkeel/hamza/alef/ta-marbuta/alef-maqsura normalization + NFC
- `lawh-mobile/__tests__/arabic/normalize.test.ts` - 12 test cases covering all normalization rules
- `lawh-mobile/lib/db/schema.ts` - Drizzle SQLite schema for surahs and ayahs tables
- `lawh-mobile/lib/db/client.ts` - expo-sqlite + Drizzle ORM client initialization
- `lawh-mobile/lib/db/seed.ts` - Chunked first-launch seed from Supabase to local SQLite
- `scripts/seed-supabase.ts` - One-time Supabase seed with 10 achievements + Quran data placeholder
- `scripts/.env.example` - Environment variable template for seed script
- `.gitignore` - Root gitignore protecting scripts/.env from accidental commit

## Decisions Made
- Arabic normalization strips tashkeel first, then normalizes character variants, then applies NFC -- this order ensures hamza variants are correctly identified after diacritics removal
- Standalone hamza (U+0621) is removed entirely rather than mapped, matching Uthmanic orthography comparison patterns
- Supabase seed script left with placeholder Quran data mapping -- field names from quran-json need manual inspection before execution

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added root .gitignore to protect secrets**
- **Found during:** Task 2
- **Issue:** No root .gitignore existed; scripts/.env could be accidentally committed with service role key
- **Fix:** Created root .gitignore with scripts/.env and .DS_Store entries
- **Files modified:** .gitignore
- **Verification:** `git status` does not show scripts/.env as trackable
- **Committed in:** 405f9a9 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Security-necessary addition to prevent service key exposure. No scope creep.

## Issues Encountered
None

## User Setup Required
None - seed script requires SUPABASE_URL and SUPABASE_SERVICE_KEY but this is documented in scripts/.env.example and will be needed only when Supabase project is linked.

## Next Phase Readiness
- normalizeArabic() ready for import by any downstream plan needing Arabic text comparison
- Drizzle schema ready for offline cache queries in navigation and review features
- Seed infrastructure ready -- actual Quran data population pending quran-json field inspection
- 12 passing Jest tests confirm normalization correctness

---
*Phase: 01-foundation*
*Completed: 2026-03-04*

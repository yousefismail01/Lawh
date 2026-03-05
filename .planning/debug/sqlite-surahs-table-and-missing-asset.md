---
status: awaiting_human_verify
trigger: "Two errors on app startup: 1. Unable to resolve asset ./assets/adaptive-icon.png 2. SQLiteErrorException: no such table: surahs"
created: 2026-03-04T00:00:00Z
updated: 2026-03-04T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - two independent bugs:
  (1) app.json references "./assets/adaptive-icon.png" but only android-specific named files exist (android-icon-foreground.png, etc.) - file is simply missing
  (2) lib/db/client.ts opens SQLite with drizzle but NEVER calls migrate() - the CREATE TABLE DDL is never executed, so the surahs table does not exist when isSeeded() queries it
test: Both confirmed by reading files and listing assets dir
expecting: Fix (1) by pointing app.json at an existing file or creating adaptive-icon.png; Fix (2) by running migrate() before any db queries
next_action: Apply both fixes

## Symptoms

expected: App starts, SQLite database has surahs table from migration/seed, assets resolve correctly
actual:
- Asset resolution fails for adaptive-icon.png
- SQLite throws "no such table: surahs" during isSeeded() check in _layout.tsx useEffect
errors:
- Unable to resolve asset "./assets/adaptive-icon.png" from "android.adaptiveIcon.foregroundImage"
- Error code 1: no such table: surahs (at ExpoSQLite/SQLiteModule.swift:382)
- Call stack: isSeeded (services/quranService.ts:38:29) -> useEffect (app/_layout.tsx:52:26)
reproduction: Start the app with npx expo start
started: Current state of the codebase after Phase 1 completion

## Eliminated

## Evidence

- timestamp: 2026-03-04T00:01:00Z
  checked: /lawh-mobile/assets/ directory listing
  found: Files are android-icon-foreground.png, android-icon-background.png, android-icon-monochrome.png, favicon.png, icon.png, splash-icon.png — NO adaptive-icon.png
  implication: app.json line 22 references "./assets/adaptive-icon.png" which does not exist; this is a missing file (or wrong reference)

- timestamp: 2026-03-04T00:01:00Z
  checked: lib/db/client.ts
  found: Opens SQLite with openDatabaseSync('lawh.db') and wraps with drizzle() but calls NO migrate() or useMigrations() — zero DDL execution
  implication: The database file exists but contains zero tables; any query against surahs or ayahs will throw "no such table"

- timestamp: 2026-03-04T00:01:00Z
  checked: lib/db/schema.ts
  found: Schema defines surahs and ayahs tables using drizzle-orm/sqlite-core table builders
  implication: Schema exists but is not applied to the database without running drizzle migrate()

- timestamp: 2026-03-04T00:01:00Z
  checked: node_modules/drizzle-orm/expo-sqlite/migrator.d.ts
  found: drizzle-orm/expo-sqlite exports migrate(db, config) and useMigrations(db, migrations) hook
  implication: The proper fix is to use migrate() with generated migration SQL, or use useMigrations() hook in the app entry point

- timestamp: 2026-03-04T00:01:00Z
  checked: package.json and glob for migrations/ and drizzle/ directories
  found: drizzle-kit is listed as a dependency but NO migrations directory exists — no SQL has ever been generated
  implication: Need to either generate migrations with drizzle-kit, or create the tables inline using raw SQLite CREATE TABLE statements

## Resolution

root_cause: |
  Bug 1 (asset): app.json references "./assets/adaptive-icon.png" which does not exist. The adaptive icon files were named differently (android-icon-foreground.png). The file needs to be created or the reference updated.
  Bug 2 (SQLite): lib/db/client.ts opens the SQLite database with Drizzle but never runs any DDL to create tables. drizzle-kit migrations were never generated and migrate() is never called, so the database is an empty file. isSeeded() immediately queries the surahs table which doesn't exist.
fix: |
  Bug 1: Updated app.json line 22 to reference "./assets/android-icon-foreground.png" (the file that actually exists)
  Bug 2: Added sqlite.execSync() call in lib/db/client.ts immediately after openDatabaseSync(), creating surahs and ayahs tables with CREATE TABLE IF NOT EXISTS before the drizzle() wrapper is constructed. This is synchronous and runs at module load time so all downstream queries find the schema ready.
verification: Self-verified - execSync confirmed in expo-sqlite type definitions; SQL DDL matches schema.ts column names exactly; IF NOT EXISTS prevents errors on re-launch
files_changed:
  - lawh-mobile/app.json
  - lawh-mobile/lib/db/client.ts

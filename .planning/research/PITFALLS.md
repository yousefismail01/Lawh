# Pitfalls Research

**Domain:** Quran Hifz & AI Recitation App (React Native / Expo / Supabase / FastAPI / GPU inference)
**Researched:** 2026-03-04
**Confidence:** HIGH (Arabic Unicode, RLS, audio pipeline); MEDIUM (Tajweed FSM, SM-2 specifics, multi-riwayah schema); LOW (word alignment internals — sparse public post-mortems)

---

## Critical Pitfalls

### Pitfall 1: Arabic Unicode Normalization Mismatch Breaks All Text Comparison

**What goes wrong:**
The Quran text stored in the database uses one Unicode representation for hamza, alef, and combining marks, but the ASR model transcription output and user input use different representations. String equality checks silently fail — the app reports every word as "wrong" even when the recitation is correct. This is the single most dangerous silent failure in the entire codebase.

**Why it happens:**
Arabic has 6+ Unicode code points for hamza variants (U+0621, U+0622, U+0623, U+0624, U+0625, U+0626, U+0654, U+0655), multiple alef forms (U+0627, U+0622, U+0623, U+0625, U+0671), and complex combining diacritic sequences. NFC and NFD behave unexpectedly with Arabic: NFC composes alef + madda into alef-with-madda-above (U+0622), but only when alef is the base — applying NFC to lam + alef + madda produces a *different* byte sequence than alef + madda, breaking equality even for visually identical text. Standard NFC/NFD normalization does not align with Unicode Arabic Mark Reordering Algorithm (AMTRA, UTR#53) requirements, meaning standard JS `normalize('NFC')` is insufficient for correct Quranic text comparison.

**How to avoid:**
1. Apply a custom normalization pipeline on **all** Arabic strings before any comparison: strip tashkeel (diacritics) → normalize hamza variants to bare alef → normalize alef variants → normalize ya/kaf regional variants → then NFC normalize.
2. Use this stripped/normalized form **only for comparison** — never for display. Always preserve original tashkeel for rendering.
3. Store a pre-computed `normalized_text` column alongside the full tashkeel `text` column in the `ayahs` table. Index `normalized_text`.
4. Apply identical normalization in the FastAPI inference layer before comparing ASR output against expected text.
5. Test using real Quran text that contains alef-hamza-above (U+0623), alef-hamza-below (U+0625), and alef-madda (U+0622) — the most common mismatch sources.

**Warning signs:**
- Every recited word is flagged as wrong despite correct pronunciation.
- Character-for-character database queries return no rows for text that visually matches stored data.
- `text.length` differs between stored text and ASR output for the same content.
- String comparisons pass in Postgres SQL editor but fail through the JS/TS client.

**Phase to address:** Foundation phase (Quran data seeding and text layer). Must be solved before any AI inference integration.

---

### Pitfall 2: Supabase RLS Enabled But Policies Are Incomplete — Silent Data Leakage

**What goes wrong:**
In 2025, 170+ Supabase-backed apps were found to have exposed databases due to RLS misconfiguration. The most common pattern: developers enable RLS on a table, write a SELECT policy, then add new tables (e.g., `tajweed_violation_log`, `review_schedule`, `achievements`) during later phases without applying RLS. These tables default to deny-all when RLS is enabled but no policy exists — but if a developer accidentally never enables RLS on a new table, it is fully public with the anon key.

**Why it happens:**
Supabase's opt-in security model assumes developers remember to enable RLS on every new table. The SQL editor bypasses RLS by default (it uses a superuser role), so developer testing in the dashboard never reveals the vulnerability. Mobile apps using the anon key with no RLS have full table access.

**How to avoid:**
1. Add a database trigger or CI check that alerts on any new table without RLS enabled. In Postgres: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;`
2. Write a dedicated RLS test file that impersonates a non-authenticated user and an authenticated user and asserts access behavior for every table.
3. For the FastAPI server's Supabase writes (using service role key): keep the service role key only in EC2 environment variables — never in the mobile app, never in an Edge Function callable by the mobile client without auth.
4. Enable RLS on every table in the initial migration, even before policies exist — this ensures deny-all is the starting state.
5. Audit: `review_schedule`, `tajweed_violation_log`, `hifz_progress`, `session_events`, `achievements` tables are all high-risk — they contain per-user data that must never cross user boundaries.

**Warning signs:**
- New table created without migration that explicitly calls `ALTER TABLE x ENABLE ROW LEVEL SECURITY`.
- Dashboard SQL Editor queries return all users' data — this seems normal but only works because editor bypasses RLS.
- A network request from the mobile app with the anon key returns another user's data.

**Phase to address:** Foundation phase (database schema and auth setup). Verify in every subsequent phase when new tables are added.

---

### Pitfall 3: Service Role Key Leakage via FastAPI → Mobile Trust Boundary

**What goes wrong:**
The FastAPI inference server writes recitation results directly to Supabase using the service role key. If the mobile app can call FastAPI endpoints without a valid Supabase JWT, an attacker can submit fabricated recitation results, inflate scores, or corrupt another user's progress. The service role key bypasses RLS entirely — whoever can trigger the FastAPI write endpoint controls the database with superuser privileges.

**Why it happens:**
FastAPI is treated as an "internal" server, so authentication middleware is deprioritized. During development, CORS is left open for testing and never tightened. The service role key is hardcoded in `.env` on EC2 but the endpoint is internet-accessible.

**How to avoid:**
1. FastAPI must validate the Supabase JWT on every request before any database write. Extract `Authorization: Bearer <token>` from the mobile request, verify it with Supabase's `SUPABASE_JWT_SECRET`, and use the verified `user_id` as the owner for all writes.
2. Never trust `user_id` from the request body — always derive it from the verified JWT.
3. Restrict FastAPI security groups in AWS to allow ingress only from your Supabase project IP range (or use VPC peering), not 0.0.0.0/0.
4. The service role key must live only in EC2 environment variables. Confirm this with an audit: `grep -r "service_role" /app --include="*.py"` should return only the env var reference.

**Warning signs:**
- FastAPI endpoint returns 200 for requests with no `Authorization` header.
- `user_id` is read from request body JSON rather than JWT claims.
- EC2 security group allows port 8000 from 0.0.0.0/0 in production.

**Phase to address:** AI inference integration phase (when FastAPI endpoint is first created and wired to mobile).

---

### Pitfall 4: Audio Pipeline Produces Wrong Format for ASR — Silent Accuracy Degradation

**What goes wrong:**
The mobile app records audio and sends it to FastAPI. The audio arrives at the correct sample rate (16kHz) but with the wrong encoding (stereo instead of mono, float32 instead of int16 PCM, or with extra silence padding). The Whisper model ingests it without error but produces worse transcriptions — words get dropped, hallucinations increase. The bug is invisible because Whisper returns a result, just the wrong one.

**Why it happens:**
Expo's `expo-av` and `expo-audio` record in platform defaults: iOS typically records m4a at 44.1kHz stereo; Android records at various defaults. Developers set `sampleRate: 16000` in `RecordingOptions` but don't verify the actual output file header. The WAV/PCM specification (mono, 16kHz, int16 signed) required by Whisper is not automatically enforced by the recording library.

**How to avoid:**
1. Use `Audio.RecordingOptionsPresets.HIGH_QUALITY` as a base, then override to mono + 16kHz + LINEAR16 encoding. Verify with `ffprobe` during development on actual device recordings — not simulator.
2. On FastAPI, add an audio validation step before inference: assert `sample_rate == 16000`, `channels == 1`, and `encoding == int16` using `soundfile` or `librosa`. Return a 422 error with details rather than running inference on bad audio.
3. Test on both iOS and Android physical devices — simulators do not reproduce the actual audio encoding pipeline.
4. If the mobile cannot reliably produce 16kHz mono, do the resampling server-side using `librosa.resample` or `ffmpeg` subprocess before passing to Whisper — do not trust client-side format claims.

**Warning signs:**
- Word Error Rate in testing is high (>20%) even on clear recordings.
- ASR output contains repeated phrases or hallucinated words not in the recited text.
- `ffprobe` on uploaded audio shows stereo channels or 44.1kHz sample rate.
- Inference latency is higher than expected (larger files due to wrong format are being processed).

**Phase to address:** Audio pipeline phase (recording setup and FastAPI intake). Validate before any Tajweed or accuracy integration.

---

### Pitfall 5: Multi-Riwayah Not Baked In From Schema Day One — Full Rewrite Required Later

**What goes wrong:**
The initial schema stores ayah text without a `riwayah` column because "Hafs is the only riwayah in v1." Six months later, adding Warsh requires adding the column to `ayahs`, migrating all FK relationships, updating every query, every Edge Function, every API endpoint, and every mobile screen that displays text. This is a full-stack rewrite touching 10+ database tables.

**Why it happens:**
"We'll add it later" feels reasonable because only one riwayah ships in v1. But the text differences between Hafs and Warsh are at the character level — the same surah+ayah number has different text. Every ayah is identified by `(surah_number, ayah_number, riwayah)` as a compound key, not just `(surah_number, ayah_number)`. Forgetting riwayah in the primary key means retrofitting requires nullable columns, data migration, and nullability reasoning everywhere.

**How to avoid:**
1. The `ayahs` table primary key must be `(surah_number, ayah_number, riwayah)` from day one. No exceptions.
2. Every API endpoint and Edge Function that accepts ayah references must include `riwayah` as an explicit parameter with a default of `'hafs'`. Never infer it.
3. The mobile app must pass `riwayah` in every request — stored in user preferences, defaulting to `'hafs'`, but architecturally explicit.
4. The FastAPI inference endpoint must accept `riwayah` and use it to look up the reference text for comparison.
5. Seed the `ayahs` table with `riwayah = 'hafs'` on every record during initial migration — this makes the column non-nullable and forces every layer to handle it.

**Warning signs:**
- `ayahs` table has no `riwayah` column in the schema.
- API response types for ayah lookups don't include `riwayah` field.
- Mobile UI hardcodes text comparison against Hafs without parameterizing the riwayah.
- Edge Function for review scheduling references ayah by `(surah, ayah)` tuple only.

**Phase to address:** Foundation phase (schema design). This is a non-negotiable architectural constraint that cannot be retrofitted cheaply.

---

### Pitfall 6: SM-2 "Ease Hell" Traps Users Into Infinite Low-Interval Loops

**What goes wrong:**
Users who struggle with difficult ayahs (a common experience for non-native Arabic speakers) repeatedly rate them as "hard" or fail them outright. Standard SM-2 responds by reducing the ease factor toward the minimum (1.3). Once trapped in ease hell, these ayahs are scheduled every 1-2 days forever, even years after initial memorization. The review queue fills with the same hard ayahs, crowding out newer memorization. Users experience the app as punishing them for struggling — the opposite of the intended experience.

**Why it happens:**
The original SM-2 algorithm reduces ease factor on every failure without a floor-based recovery mechanism. It also treats a month-overdue ayah answered correctly the same as a one-day-overdue ayah — no proportional credit for "I haven't seen this in 6 weeks but still remembered it." The algorithm doesn't add jitter to intervals, so related ayahs learned together are always reviewed together, which creates context-dependent memory rather than genuine recall.

**How to avoid:**
1. Implement SM-2+ modifications: add proportional credit for overdue items answered correctly (longer overdue + correct = bigger interval boost).
2. Set a minimum ease factor of 1.3 but implement an ease recovery mechanism: if an item is answered correctly 3 consecutive times at minimum ease, gradually restore ease factor.
3. Add ±10% randomized jitter to all calculated intervals to prevent synchronized review batches for consecutive ayahs.
4. Cap daily review load: if the queue exceeds 50 ayahs, sort by urgency (most overdue first) and defer the rest with a user explanation.
5. For Quran-specific context: distinguish "first memorization" (new ayah) from "revision" (known ayah) — apply different ease parameters to each. An ayah in active memorization should not be treated the same as an ayah memorized 2 years ago.

**Warning signs:**
- Test user with 10 failed ayahs sees those same ayahs scheduled every day indefinitely.
- Review queue grows faster than the user can clear it after 2 weeks of use.
- User ease factor for any ayah reaches the minimum and stays there.
- Consecutive ayahs (e.g., ayahs 1-10 of Al-Baqarah) are always reviewed as a synchronized batch.

**Phase to address:** SM-2 / review scheduling implementation phase. Build the modified version from the start — retrofitting SM-2+ into a deployed SM-2 requires recalculating all user intervals.

---

### Pitfall 7: Tajweed FSM Produces High False Positive Rate — Users Lose Trust

**What goes wrong:**
The Tajweed Finite State Machine classifies phoneme sequences and flags rule violations. Because Quranic phoneme boundaries are ambiguous (especially for rules like Ikhfa, Idgham, and Ghunna which depend on context across word boundaries), the FSM produces false positives: correct recitations are flagged as violations. After 3-5 incorrect flags in a single session, users stop trusting the feedback and ignore it entirely — destroying the core value proposition.

**Why it happens:**
Building a Tajweed FSM from phoneme sequences is more deterministic than pure ML classification, but the phoneme sequences themselves come from wav2vec2 output which has its own error rate. Error propagation: ASR error → phoneme classification error → FSM traversal error → incorrect rule flag. The chain amplifies uncertainty. Research shows that even specialized Tajweed detection models achieve only 57% accuracy on generalization tests (external validation) despite high internal validation scores.

**How to avoid:**
1. Apply a confidence threshold before flagging: only display a Tajweed violation to the user if the phoneme classifier confidence exceeds 0.85. Below the threshold, log internally but don't surface to the user.
2. Prioritize high-precision rules over high-recall: it's better to miss 30% of real violations than to flag 30% of correct recitations as wrong. Start with the 3-4 most acoustically unambiguous rules (e.g., clear Madd lengths, definite Sun/Moon letter assimilation).
3. Weight the FSM by rule frequency in the specific ayah being recited — pre-compute which rules apply to which ayah positions and focus detection on those positions.
4. Track per-rule false positive rate in the `tajweed_violation_log` and use this to tune confidence thresholds over time.
5. In the UI, present Tajweed feedback as "suggestions" in early phases — not hard "mistakes" — to preserve user trust during model calibration.

**Warning signs:**
- More than 20% of test recordings from expert reciters trigger any Tajweed violation flag.
- The same rule is flagged for the same correct recitation consistently.
- User session duration drops after Tajweed feedback is introduced (A/B test signal).
- Phoneme classifier confidence scores cluster below 0.7 on real device recordings.

**Phase to address:** Tajweed engine phase. Do not ship Tajweed feedback to users until false positive rate is validated below 15% on a held-out set of correct recitations.

---

### Pitfall 8: iOS Audio Session Interrupted by Phone Call — Recording Data Lost

**What goes wrong:**
A user is mid-recitation session when a phone call arrives. iOS interrupts the AVAudioSession. The recording stops immediately. When the call ends, the app resumes but the audio file is either truncated or only contains the post-interruption portion. The recitation result is incorrect (partial audio submitted for scoring), or the session crashes silently. On Android, the RECORD_AUDIO permission can be revoked by an incoming call on some OEM builds.

**Why it happens:**
iOS gives system-level priority to the phone. There is no programmatic way to prevent AVAudioSession interruption from a phone call. Expo's `expo-audio` and `expo-av` abstract over AVAudioSession but do not automatically handle interruption/resumption — the developer must explicitly listen for interruption events and implement recovery.

**How to avoid:**
1. Register an interruption handler using `Audio.setAudioModeAsync` and the `AVAudioSession.InterruptionNotification` observer (via native module or Expo's audio event system). On interruption: stop recording, discard the partial file, update UI state, and inform the user.
2. Never submit a partial recording for inference. Track recording state in a React ref (not state) to avoid stale closure issues in the interruption callback.
3. For Android: request `FOREGROUND_SERVICE_MICROPHONE` permission via config plugin to maintain the recording foreground service during audio focus changes.
4. During development: test interruption by actually calling the device during a recitation session on a physical iOS device. Simulators cannot reproduce this.
5. Design the session UX to be restartable — if a session is interrupted, show a "Resume session?" dialog rather than forcing the user to start over.

**Warning signs:**
- Crash reports from iOS containing `AVAudioSessionInterruptionNotification` in the stack trace.
- User bug reports: "app stopped recording in the middle."
- Audio files in storage with unexpected short durations (< 2 seconds) from what should be full-ayah recordings.
- No interruption handling code in the audio recording hook.

**Phase to address:** Audio pipeline phase, before any production deployment.

---

### Pitfall 9: Offline-First Sync Conflicts Corrupt Hifz Progress Data

**What goes wrong:**
A user memorizes ayahs on their phone while offline, then opens the app on a different device (or the same device after clearing cache). The local expo-sqlite records and the Supabase records diverge. When sync runs, the app naively overwrites Supabase with local data or vice versa — silently destroying whichever side was newer. The user loses days of progress or has progress phantom-reset.

**Why it happens:**
Offline-first sync for relational data requires conflict resolution strategy. The simple "last write wins" approach is dangerous when the same ayah strength score is modified on two devices. expo-sqlite does not have built-in sync; custom sync code almost always starts with a naive "upload local, overwrite remote" pattern.

**How to avoid:**
1. Add a `last_modified_at` timestamp to every synced row. Use `updated_at DEFAULT NOW()` with a Postgres trigger to auto-update it.
2. On sync, compare local `last_modified_at` vs server `last_modified_at`. Use the newer record. Log conflicts for debugging.
3. For `hifz_progress` and `review_schedule`: never delete-and-reinsert during sync — use `UPSERT` with conflict resolution on `(user_id, ayah_id)`.
4. For `session_events` (append-only): use a UUID primary key generated on device — this makes offline inserts idempotent and mergeable without conflict.
5. Limit offline-first complexity to the essential tables: `hifz_progress`, `review_schedule`, `session_events`. Derive everything else from these on the server side.

**Warning signs:**
- Sync code uses `DELETE FROM table WHERE user_id = ?` followed by `INSERT`.
- No `last_modified_at` column on synced tables.
- User reports seeing "ghost" progress that appeared then disappeared.
- Sync function runs successfully but Supabase data is older than local data.

**Phase to address:** Offline-first implementation phase. Design the sync protocol before writing sync code — the schema decisions (timestamps, UUID PKs) must precede implementation.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store riwayah as global constant instead of per-table column | Simpler initial schema | Full schema rewrite when adding Warsh — touches every table, query, and API | Never — bake riwayah into schema from day one |
| Skip audio format validation on FastAPI | Faster endpoint implementation | Silent accuracy degradation — Whisper accepts bad audio and hallucinates | Never — add validation at the intake boundary |
| Use standard SM-2 without SM-2+ modifications | Correct algorithm baseline | Users get trapped in ease hell after ~3 weeks of use | Acceptable for v1 alpha only, fix before general release |
| Hardcode `riwayah = 'hafs'` in mobile components | Saves 1 prop per component | Every component needs retrofit when Warsh launches | Never — pass riwayah as explicit parameter everywhere |
| Enable RLS but skip writing test coverage | Shipping faster | Security regression when adding new tables — no automated safety net | Never — RLS tests are cheap and high-value |
| Surface all Tajweed violations regardless of confidence | Maximizes feedback | Destroys user trust via false positives within first session | Never in production — threshold confidence before display |
| Sync by overwriting server data with local | Simple sync code | Silent data loss on multi-device use | Never — use upsert with timestamp comparison |
| Ship without audio interruption handling | Faster initial implementation | Crash reports and data loss on iOS when phone calls arrive | Acceptable for internal testing, not for App Store release |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase RLS | Using the SQL Editor to test policies (editor bypasses RLS) | Use the Supabase client SDK with real JWT tokens to test policies |
| Supabase RLS | Writing SELECT policy but forgetting INSERT also needs SELECT to return the new row | Add explicit SELECT policy alongside INSERT policy for every table |
| Supabase + FastAPI | FastAPI reads `user_id` from request body | FastAPI validates Supabase JWT and extracts `user_id` from verified claims only |
| expo-audio recording | Trusting `sampleRate: 16000` in RecordingOptions is sufficient | Validate audio file headers on the server — client-side settings are not always honored |
| Whisper ASR | Sending audio > 30 seconds as a single chunk | Segment audio into ≤30s chunks; Whisper's encoder was trained on 30s windows |
| Whisper ASR | No `attention_mask` for batched inference | Always pass `attention_mask` in batched inference to avoid subtle accuracy bugs |
| wav2vec2 phoneme model | Testing only on simulator audio | Test on physical device recordings — simulator microphone produces different spectral characteristics |
| quran-json dataset | Assuming text is already NFC normalized | Run normalization pipeline at seed time; different source files use different Unicode forms |
| expo-sqlite sync | Using `DELETE` + `INSERT` for sync | Use `INSERT OR REPLACE` / upsert with `ON CONFLICT DO UPDATE` and timestamp comparison |
| Supabase Edge Functions | Testing Edge Functions in Supabase dashboard (uses service role) | Test Edge Functions via actual HTTP requests with anon key and user JWT |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No index on `riwayah` column in `ayahs` table | Slow ayah lookup even for single verses | Add composite index on `(surah_number, ayah_number, riwayah)` | Day one — full table scans on a 6236-row table are instant locally but visible at scale with joins |
| RLS policies referencing `auth.uid()` without indexed FK | Every query triggers a sequential scan for user data | Index all `user_id` columns referenced in RLS policies | Noticeable at ~1000+ sessions per user |
| N+1 queries in review queue loader | Review queue takes 3-5 seconds to load | Fetch review queue in a single Supabase query with joins, not in a loop | At 50+ due ayahs |
| Whisper inference blocking FastAPI event loop | Concurrent users wait sequentially | Run Whisper inference in a `ProcessPoolExecutor` or use async background tasks; never in the async route handler directly | First time 2 users recite simultaneously |
| Audio upload as base64 in JSON body | Large payloads inflate request size 33% | Upload as multipart/form-data binary, not base64-encoded JSON | Ayahs longer than ~5 seconds |
| SM-2 recalculating entire user history on each review | Review submission takes 500ms+ | Calculate only the updated interval for the specific ayah reviewed; store pre-computed next_review_date | At ~500+ reviewed ayahs per user |
| expo-sqlite queries on the main JS thread | UI jank during database reads | Use `expo-sqlite`'s async API; never run queries synchronously in render paths | Any meaningful database size |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Supabase `service_role` key bundled in mobile app | Complete RLS bypass — any user can read/write all users' data | `service_role` key lives only in EC2 environment variables. Anon key only in mobile app. |
| FastAPI endpoint accepts `user_id` from request body | Attacker submits another user's `user_id` to write their Hifz progress | Extract `user_id` exclusively from validated Supabase JWT claims in FastAPI middleware |
| EC2 security group allows 0.0.0.0/0 on FastAPI port | FastAPI inference endpoint publicly accessible without auth | Restrict security group; require JWT validation on every route; do not rely on network security alone |
| RLS policy uses `user_metadata` JWT claim | Users can self-modify `user_metadata` to escalate access | Use `auth.uid()` only — never `auth.jwt()->'user_metadata'` for access control decisions |
| Supabase anon key treated as secret | Not a secret — it is embedded in the mobile binary and extractable | Treat anon key as public. All security must rely on RLS policies, not on keeping the anon key private |
| Missing RLS on `tajweed_violation_log` | Detailed recitation history of all users publicly readable | Enable RLS + `user_id = auth.uid()` policy on every user-linked table, including analytics/log tables |
| Audio files in Supabase Storage without access control | Any user can access another user's recitation audio | Apply Storage RLS: bucket policy restricts access to `{user_id}` path prefix only |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing Tajweed violations during active recitation | Breaks flow — users stop mid-verse to read feedback | Show Tajweed feedback only after the full ayah is complete, in a post-recitation review panel |
| Review queue sorted only by due date | Users see the hardest ayahs first (most overdue) and feel overwhelmed | Primary sort by due date, secondary sort by ayah order within surah — breaks up difficulty |
| Streak counter resets at midnight UTC, not user's local midnight | Muslims who recite after midnight local time lose their streak | Use user's timezone (stored on profile) for all streak calculations — never UTC unless user is in UTC |
| No loading state during FastAPI inference (1-3 seconds) | App appears frozen — users tap buttons repeatedly | Show waveform animation or spinner with "Analyzing recitation..." immediately after recording stops |
| Hifz strength score changes too dramatically after a single session | Users see ayahs they know well drop to "weak" after one bad review | Smooth strength score with exponential moving average — single bad session should not collapse a score |
| Forcing Tajweed Arabic terminology without explanation | Non-Arabic-speaking Muslims cannot act on "Ikhfa violation" | Show Arabic rule name + English translation + brief example for every violation flag |
| Push notification for review sent at app's default time (8 AM UTC) | Notification arrives at wrong time for users in different timezones | Schedule push notifications using user's preferred review time in their local timezone |

---

## "Looks Done But Isn't" Checklist

- [ ] **Arabic text rendering:** Tashkeel appears correct on iOS but test Android specifically — Android fonts may not support all Quranic characters (U+06D6–U+06DC extended marks). Verify with physical Android device, not emulator.
- [ ] **RLS:** Policy written and tested in SQL Editor — verify by making requests with an anon-key client as an authenticated user and as an unauthenticated user.
- [ ] **Audio recording:** RecordingOptions set to 16kHz — confirm with `ffprobe` on an actual device recording, not simulator.
- [ ] **Multi-riwayah:** `riwayah` column exists in `ayahs` table — verify every query, Edge Function, and API response type explicitly includes `riwayah` as a parameter or return field.
- [ ] **SM-2 scheduling:** Edge Function returns next review date — verify the ease factor floor is respected and that overdue items get proportional credit.
- [ ] **Offline sync:** App syncs on reconnect — disconnect Wi-Fi, record a session, reconnect, verify Supabase received the correct data without overwriting existing newer records.
- [ ] **Streak calculation:** Streak increments correctly — verify with a user whose timezone is UTC+12 that midnight rollover triggers correctly, not at UTC midnight.
- [ ] **Tajweed confidence threshold:** Violation is logged — confirm that violations below confidence threshold are not surfaced to the user, only stored in `tajweed_violation_log`.
- [ ] **FastAPI JWT validation:** Inference endpoint returns results — verify that requests without a valid JWT return 401, not 200 with results.
- [ ] **Storage access control:** Audio upload succeeds — verify a second user cannot access the first user's audio file path via the Supabase Storage public URL.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Arabic normalization mismatch discovered post-launch | HIGH | Write a migration script normalizing all stored `ayahs` text; re-seed from source with normalization applied; update ASR comparison pipeline; backfill `normalized_text` column; re-run all historical comparisons |
| RLS missing on tables discovered post-launch | MEDIUM | Enable RLS immediately (instant, non-destructive); write policies; audit existing data for cross-user contamination; notify affected users if data was exposed |
| Service role key accidentally committed | HIGH | Rotate immediately in Supabase dashboard; deploy new key to EC2; force-rotate key in mobile if it was embedded; audit logs for suspicious writes |
| SM-2 ease hell widespread in user base | MEDIUM | Run a one-time migration resetting ease factors for all ayahs below 1.5 to 1.5; apply SM-2+ modifications in Edge Function; no user-visible disruption but review intervals change |
| Multi-riwayah not in schema (discovered late) | VERY HIGH | Requires new table structure, data migration, backfill of all FK references, versioned API changes, mobile app update — treat as a new project phase |
| Audio format mismatch causing systematic ASR errors | MEDIUM | Add server-side resampling to FastAPI; no mobile update required; historical sessions cannot be re-scored but future sessions correct immediately |
| Offline sync data corruption | HIGH | Identify affected users via `last_modified_at` discrepancies; restore from backup for affected rows; implement correct conflict resolution; consider compensating users |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Arabic Unicode normalization mismatch | Phase 1: Foundation (data seeding) | Run comparison tests across all 6236 ayahs with ASR output normalization applied; zero mismatches expected |
| Multi-riwayah not in schema | Phase 1: Foundation (schema design) | Schema review: `ayahs` PK includes `riwayah`; every query parameterizes riwayah |
| RLS incomplete or missing | Phase 1: Foundation + every phase adding tables | Automated RLS audit query returns zero tables without RLS; integration tests pass for unauthorized access attempts |
| Service role key leakage | Phase 2: AI inference integration (FastAPI setup) | FastAPI endpoint returns 401 for requests with no/invalid JWT; `user_id` is never read from request body |
| Audio format mismatch | Phase 2: Audio pipeline implementation | `ffprobe` on device recordings confirms mono 16kHz PCM; FastAPI validation rejects malformed audio with 422 |
| Audio session interruption handling | Phase 2: Audio pipeline implementation | Physical device test: incoming call during recitation does not crash app; session recovers gracefully |
| SM-2 ease hell | Phase 3: Review scheduling (SM-2 Edge Function) | Simulate 30 consecutive failures on one ayah; verify ease factor does not fall below minimum; verify recovery mechanism triggers |
| Tajweed false positives | Phase 4: Tajweed engine | Expert reciter test set: false positive rate < 15%; confidence thresholding confirmed in `tajweed_violation_log` |
| Offline sync conflicts | Phase 5: Offline-first sync | Two-device conflict test: modify same ayah offline on both devices, sync, verify newest record wins |
| Streak timezone errors | Phase 5: Gamification | Test with user profiles in UTC-12, UTC, UTC+12; verify streak increments at correct local midnight |

---

## Sources

- [Unicode Arabic Mark Rendering (UTR #53)](https://www.unicode.org/reports/tr53/) — authoritative on why NFC/NFD are insufficient for Arabic diacritics
- [Arabic Search Normalization — Discourse Meta](https://meta.discourse.org/t/arabic-search-normalization-missing-support-for-hamza-variants-ya-kaf-forms-and-orthographic-equivalence/384253) — real-world hamza/ya/kaf normalization failures in production
- [Supabase Security Flaw: 170+ Apps Exposed by Missing RLS — byteiota](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/) — 2025 incident report on RLS misconfiguration at scale
- [Fixing RLS Misconfigurations in Supabase — ProsperaSoft](https://prosperasoft.com/blog/database/supabase/supabase-rls-issues/) — common RLS mistake taxonomy
- [Supabase Row Level Security — Official Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — INSERT requiring SELECT policy, RLS performance
- [A Better Spaced Repetition Algorithm: SM2+ — BlueRaja](https://www.blueraja.com/blog/477/a-better-spaced-repetition-learning-algorithm-sm2+) — documented SM-2 flaws and proposed fixes
- [From Files to Buffers: Audio Pipelines in React Native — Callstack](https://www.callstack.com/blog/from-files-to-buffers-building-real-time-audio-pipelines-in-react-native) — PCM/WAV format pitfalls and I/O overhead
- [Real-time audio processing with Expo and native code — Expo Blog](https://expo.dev/blog/real-time-audio-processing-with-expo-and-native-code) — JSI, TurboModules, audio pipeline architecture
- [Enabling Background Recording on Android with Expo — Medium](https://drebakare.medium.com/enabling-background-recording-on-android-with-expo-the-missing-piece-41a24b108f6d) — Android foreground service config plugin requirement
- [Handling Audio Interruptions — Apple Developer](https://developer.apple.com/documentation/avfaudio/handling-audio-interruptions) — iOS AVAudioSession interruption behavior
- [TajweedAI: A Hybrid ASR-Classifier for Qalqalah Detection — NeurIPS 2025](https://neurips.cc/virtual/2025/133028) — 57% generalization accuracy despite 100% internal validation
- [Optimal Sample Rate for Whisper — GitHub Discussion](https://github.com/openai/whisper/discussions/870) — Whisper sample rate behavior and resampling pipeline
- [Downsides of Offline-First — RxDB](https://rxdb.info/downsides-of-offline-first.html) — conflict resolution, storage limits, schema migration challenges
- [Offline-first React Native with WatermelonDB and Supabase — Supabase Blog](https://supabase.com/blog/react-native-offline-first-watermelon-db) — sync architecture patterns
- [Tarteel ML Journey: Data Annotation — tarteel.ai](https://tarteel.ai/blog/tarteels-ml-journey-part-2/) — 3 years of R&D for word-level mistake detection
- [Mispronunciation Detection of Quranic Recitation Rules — arXiv 2305.06429](https://arxiv.org/pdf/2305.06429) — academic baseline on detection accuracy and dataset constraints
- [Spaced Repetition and Quran Memorization — Tarteel Blog](https://tarteel.ai/blog/spaced-repetition-and-quran-memorization-how-to-make-your-hifz-stick-for-life/) — domain-specific SR application insights

---
*Pitfalls research for: Quran Hifz & Recitation AI App (Lawh)*
*Researched: 2026-03-04*

# Security Policy

This repository handles production user data and privileged database access. Treat security requirements as **non-optional**.

## Agent Rules (MUST FOLLOW)

- **No secrets in code**
  - Never commit: Service role keys, JWT secrets, database passwords, API keys.
  - Mobile app env vars must be limited to `EXPO_PUBLIC_*` and must be non-sensitive.
  - `.env`, `.mcp.json`, and any file containing secrets must be in `.gitignore`.

- **Assume public keys are public**
  - Anyone can extract keys from a mobile app binary.
  - All data protection must be enforced via **RLS**, safe RPCs, and server-side checks.

- **Service role usage**
  - Service role keys may only be used in:
    - FastAPI inference server (`lawh-api/`)
    - Supabase Edge Functions
    - Trusted backend workers
  - **Never expose service role keys in the mobile app (`lawh-mobile/`).**

- **Mobile app uses anon key only**
  - The Supabase client in `lawh-mobile/` must only use the anon/publishable key.
  - All user-specific data access must go through authenticated Supabase client (user JWT).
  - The mobile app must never import or reference the service role key.

- **RLS is mandatory**
  - Every user-facing table must have RLS enabled — no exceptions.
  - Avoid permissive write policies like `WITH CHECK (true)` for `INSERT/UPDATE/DELETE`.
  - Test RLS policies: verify users cannot read/write other users' data.

- **Multi-riwayah: explicit typed parameter**
  - Every DB query, API call, and mobile layer must accept `riwayah` as an explicit typed parameter.
  - Never assume a default riwayah — always pass it explicitly.

- **Prefer Edge Functions or FastAPI for privileged writes**
  - Any endpoint that modifies sensitive data must:
    - Validate input
    - Apply rate limits where appropriate
    - Use service-role DB writes on the server
  - Mobile app must not call write RPCs directly for sensitive operations.

- **Function hardening**
  - All `SECURITY DEFINER` functions must have a fixed `search_path`:
    ```sql
    SET search_path = public, extensions
    ```
  - Restrict function execution grants:
    - Only grant `EXECUTE` to roles that need it (often `service_role` only).

- **Do not increase attack surface**
  - Avoid broad CORS (`*`) on Edge Functions except where explicitly intended.
  - FastAPI endpoints must validate the service role key or user JWT on every request.

## Required Checks Before Merge

- **Repository scan**
  - Search for leaked keys:
    - Service role keys (`service_role`)
    - JWTs (`eyJ...`)
    - Any secret keys or tokens
  - Verify `.env` and `.mcp.json` are not tracked.

- **Database advisors** (required after any DB/RLS/function change)
  - Run security advisor
  - Run performance advisor

- **Verify write paths**
  - Confirm no tables allow anonymous inserts without validation.
  - Confirm sensitive write actions route through Edge Functions or FastAPI.

## Enforced Architecture

### Mobile App (`lawh-mobile/`)

- Uses Supabase anon key only — authenticated via user JWT after login.
- Direct writes to protected tables from mobile are not allowed for sensitive ops.
- Audio uploads go through authenticated Supabase Storage with RLS.
- Local-only data (bookmarks, settings) stored on device until user authenticates.

### FastAPI Inference Server (`lawh-api/`)

- Stateless — no local database.
- Writes to Supabase via service role key only.
- Validates requests (API key or user JWT).
- Tajweed violation confidence threshold: 0.85+ before surfacing to users.

### Supabase Edge Functions

- Use service role key for privileged operations.
- Validate `Authorization` header on every request.
- Input validation required on all parameters.

## Database Hardening Rules

- **RLS on all user tables** — no exceptions.
- Admin tables are service-role only (no `anon`/`authenticated` table privileges).
- User data tables (hifz progress, recitation scores, bookmarks) require `auth.uid() = user_id`.
- **Function grants**:
  - Sensitive RPCs are `service_role` execute only.
  - `SECURITY DEFINER` functions must have fixed `search_path`.

## Arabic Text Security

- All Arabic text must be NFC normalized before storage and comparison.
- Full tashkeel must be preserved — never strip diacritics from stored Quran text.
- User input containing Arabic must be sanitized against injection before DB queries.

## Incident Response (If a key is exposed)

- Rotate impacted keys immediately.
- Audit RLS policies and function grants.
- Review logs for unusual access patterns.
- Add a regression test/checklist entry to prevent recurrence.

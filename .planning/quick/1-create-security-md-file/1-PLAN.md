---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - SECURITY.md
autonomous: true
requirements:
  - QUICK-1
must_haves:
  truths:
    - "SECURITY.md exists at the project root"
    - "File contains the full security template content provided by the user"
  artifacts:
    - path: "SECURITY.md"
      provides: "Security rules and agent guidelines for the project"
      contains: "## Agent Rules (MUST FOLLOW)"
  key_links: []
---

<objective>
Create SECURITY.md at the project root with the user-provided security template.

Purpose: Establish a security reference document that agents and contributors must follow — covering secrets handling, RLS requirements, service role usage, and database hardening rules.
Output: /SECURITY.md containing the full security template.
</objective>

<execution_context>
@/Users/yousef/.claude/get-shit-done/workflows/execute-plan.md
@/Users/yousef/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create SECURITY.md at project root</name>
  <files>SECURITY.md</files>
  <action>
Create the file `/Users/yousef/Documents/Projects/Lawh/SECURITY.md` with the exact content below. Do not modify, reformat, or summarize — write it verbatim.

```markdown
# Security Template

This repository handles production user data and privileged database access. Treat security requirements as **non-optional**.

## Agent Rules (MUST FOLLOW)

- **No secrets in code**
  - Never commit: Service role keys, JWT secrets, database passwords, API keys.
  - Client-side env vars must be limited to `NEXT_PUBLIC_*` and must be non-sensitive.

- **Assume public keys are public**
  - Anyone can extract client-side keys from a web app.
  - All data protection must be enforced via **RLS**, safe RPCs, and server-side checks.

- **Service role usage**
  - Service role keys may only be used in:
    - Next.js Route Handlers (`src/app/api/**`)
    - Edge Functions or serverless functions
    - Trusted backend workers
  - Never expose service role keys to the browser.

- **RLS is mandatory**
  - Any public or semi-public table must have RLS enabled.
  - Avoid permissive write policies like `WITH CHECK (true)` for `INSERT/UPDATE/DELETE`.

- **Prefer server endpoints for public write actions**
  - Any endpoint that records analytics/clicks must:
    - Validate input (e.g. `zod`)
    - Apply rate limits
    - Use service-role DB writes on the server
  - Client components must not call write RPCs directly. Use a server route.

- **Function hardening**
  - All security definer functions must have a fixed `search_path`:
    ```sql
    SET search_path = public, extensions
    ```
  - Restrict function execution grants:
    - Only grant `EXECUTE` to roles that need it (often `service_role` only).

- **Do not increase attack surface**
  - Do not attach privileged objects to `window` unless strictly required.
  - Avoid broad CORS (`*`) except where explicitly intended and reviewed.

## Required Checks Before Merge

- **Repository scan**
  - Search for leaked keys:
    - Service role keys
    - JWTs (`eyJ...`)
    - Any secret keys or tokens

- **Database advisors** (required after any DB/RLS/function change)
  - Run:
    - Security advisor
    - Performance advisor

- **Verify public write paths**
  - Confirm no public tables allow anonymous inserts without validation/rate limiting.
  - Confirm any public write action is routed through a server endpoint.

## Patterns To Use

- **Server-side click tracking**
  - Use a Next API route with rate limiting and service-role DB writes.
  - Example endpoints:
    - `/api/ad-click` -> calls `record_ad_click(...)` via service role
    - `/api/affiliate-click` -> calls `record_affiliate_movie_click(...)` via service role

- **Restrict click-tracking RPC execution**
  - Click tracking functions must be `service_role`-only.
  - Never grant these functions to `anon` or `authenticated`.

- **Public analytics**
  - Prefer a server endpoint that accepts sanitized payloads and enforces bot checks.

- **Admin-only RPC actions**
  - Admin endpoints must use service role client and proper authorization.
  - Avoid using the anon client inside admin routes.

## Enforced Architecture

### Option A (Enforced): Server routes for any privileged writes

- Direct writes to protected tables from client code are not allowed.
- All privileged writes must go through Next.js Route Handlers under `src/app/api/**`.
- Server routes must:
  - Validate input (e.g. `zod`)
  - Rate limit
  - Authenticate via `Authorization: Bearer <JWT>` (enterprise/stateless)
  - Use service role for DB writes

### Option B (Enforced): Anonymous activity is local-only

- Anonymous activity must remain local until login.
- Cloud state for user data is **authenticated-only**:
  - User watchlists
  - Recently viewed items
  - Watch progress
  - Any user-specific data

## Key Implementation Points

- **Authorization header helpers**
  - Use `authFetch` for user-authenticated endpoints.
  - Use `apiFetch` for management portal calls.

- **Admin endpoints**
  - All `/api/admin/**` endpoints must use proper authorization and service role client.

- **Management interfaces**
  - Management UI must use server endpoints for all privileged operations.

## Database Hardening Rules (Enforced)

- **Protected tables** (examples):
  - Admin tables
  - Push tokens
  - User data tables
  - Any sensitive business data

- **RLS and grants**
  - Admin tables are service-role only (no `anon`/`authenticated` table privileges).
  - Public tables allow read-only access where appropriate.
  - Table writes are service-role only (via server endpoints).

- **Function grants + hardening**
  - Sensitive RPCs are `service_role` execute only:
    - User registration functions
    - Click tracking functions
    - Admin functions
    - User data retrieval functions
  - SECURITY DEFINER functions must have fixed `search_path`.

## Incident Response (If a key is exposed)

- Rotate impacted keys immediately.
- Audit RLS policies and function grants.
- Review logs for unusual access patterns.
- Add a regression test/checklist entry to prevent recurrence.
```
  </action>
  <verify>
    <automated>test -f /Users/yousef/Documents/Projects/Lawh/SECURITY.md && grep -q "Agent Rules (MUST FOLLOW)" /Users/yousef/Documents/Projects/Lawh/SECURITY.md && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>SECURITY.md exists at the project root and contains the full security template including the "Agent Rules (MUST FOLLOW)" section.</done>
</task>

</tasks>

<verification>
Run: `test -f SECURITY.md && grep -q "Incident Response" SECURITY.md && echo "PASS"`

Expected: PASS — file exists and contains the complete template through the final section.
</verification>

<success_criteria>
- SECURITY.md exists at `/Users/yousef/Documents/Projects/Lawh/SECURITY.md`
- File contains all sections: Agent Rules, Required Checks Before Merge, Patterns To Use, Enforced Architecture, Key Implementation Points, Database Hardening Rules, Incident Response
- File content matches the user-provided template verbatim
</success_criteria>

<output>
After completion, create `.planning/quick/1-create-security-md-file/1-SUMMARY.md` with what was done.
</output>

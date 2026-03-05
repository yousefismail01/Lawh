---
phase: quick-2
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - CLAUDE.md
autonomous: true
requirements:
  - SECURITY-ENFORCEMENT
must_haves:
  truths:
    - "CLAUDE.md exists at project root and is auto-loaded by Claude Code"
    - "CLAUDE.md references SECURITY.md so security rules are always in scope"
    - "CLAUDE.md includes project context sufficient for any conversation to start correctly"
  artifacts:
    - path: "CLAUDE.md"
      provides: "Auto-loaded Claude Code project instructions"
      contains: "reference to SECURITY.md, project overview, tech stack, non-negotiable constraints"
  key_links:
    - from: "CLAUDE.md"
      to: "SECURITY.md"
      via: "explicit file reference with directive"
      pattern: "SECURITY\\.md"
---

<objective>
Create CLAUDE.md at the project root so Claude Code automatically loads project context and security rules at the start of every conversation.

Purpose: Claude Code reads CLAUDE.md automatically on session start. Placing a reference to SECURITY.md here means every code change in this repo — regardless of which conversation — is subject to the security rules without the user having to repeat them.

Output: /CLAUDE.md — concise project brief + binding security directive
</objective>

<execution_context>
@/Users/yousef/.claude/get-shit-done/workflows/execute-plan.md
@/Users/yousef/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@SECURITY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create CLAUDE.md at project root</name>
  <files>CLAUDE.md</files>
  <action>
Create /CLAUDE.md with the following content exactly as structured below. Keep it concise — it is loaded at the start of every conversation and must not waste context.

Sections to include:

1. **Project** — One-line description: "Lawh is an AI-powered Quran memorization (Hifz) and recitation correction app for iOS and Android."

2. **Tech Stack** — Bullet list:
   - Mobile: React Native + Expo (managed workflow), TypeScript strict
   - Backend: Supabase (auth, DB, realtime, edge functions, storage)
   - AI Inference: FastAPI on AWS EC2 g4dn.xlarge (NVIDIA T4 GPU) — stateless, writes to Supabase via service role key
   - Audio: @mykin-ai/expo-audio-stream (16kHz mono WAV)
   - Database: 10 tables, full RLS, SM-2 spaced repetition, multi-riwayah PK

3. **Security** — A binding directive:

```
## Security

All code changes MUST comply with SECURITY.md at the project root.
Read SECURITY.md before writing any code that touches:
- Authentication or user data
- Supabase queries or RLS policies
- Environment variables or secrets
- API endpoints or server routes
- Database functions or RPCs
```

4. **Non-Negotiable Constraints** — Short list:
   - Supabase anon key only in mobile app — service role key is server-only (FastAPI, edge functions, never mobile)
   - RLS on ALL user tables — no exceptions
   - Multi-riwayah: every DB/API/mobile layer accepts riwayah as an explicit typed parameter
   - Arabic text: full tashkeel preserved for display, NFC normalized, RTL on iOS + Android
   - FastAPI is inference-only — no local database, writes to Supabase via service role key only
   - Tajweed violations require 0.85+ confidence before surfacing to users

5. **Key Paths** — Brief orientation:
   - Mobile app: lawh-mobile/
   - FastAPI inference: lawh-api/
   - Supabase migrations: supabase/migrations/
   - Planning docs: .planning/

Keep the total file under 60 lines.
  </action>
  <verify>
    <automated>test -f /Users/yousef/Documents/Projects/Lawh/CLAUDE.md && grep -q "SECURITY.md" /Users/yousef/Documents/Projects/Lawh/CLAUDE.md && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>CLAUDE.md exists at project root, contains a reference to SECURITY.md, and is under 60 lines</done>
</task>

</tasks>

<verification>
- CLAUDE.md exists at /CLAUDE.md (project root)
- File contains the string "SECURITY.md" (reference enforced)
- File contains project name "Lawh"
- File contains tech stack orientation (Expo, Supabase, FastAPI)
- File is concise — under 60 lines to minimize context cost on every session start
</verification>

<success_criteria>
Claude Code will auto-load CLAUDE.md on every conversation start. Any session working in this repo will: (1) know the project context without asking, (2) have a binding directive to read SECURITY.md before touching auth/data/secrets/APIs, (3) know the non-negotiable architectural constraints.
</success_criteria>

<output>
After completion, create `.planning/quick/2-integrate-security-md-rules-into-claude-/2-SUMMARY.md` documenting what was created.
</output>

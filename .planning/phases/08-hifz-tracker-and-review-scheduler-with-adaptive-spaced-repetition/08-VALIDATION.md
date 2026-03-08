---
phase: 8
slug: hifz-tracker-and-review-scheduler-with-adaptive-spaced-repetition
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 + jest-expo 55.0.9 |
| **Config file** | `lawh-mobile/jest.config.js` |
| **Quick run command** | `cd lawh-mobile && npx jest --testPathPattern="sr\|hifz" --no-coverage` |
| **Full suite command** | `cd lawh-mobile && npx jest --no-coverage` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd lawh-mobile && npx jest --testPathPattern="sr|hifz" --no-coverage`
- **After every plan wave:** Run `cd lawh-mobile && npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 0 | SM2-01 | unit | `npx jest lib/sr/sm2plus.test.ts` | No — W0 | ⬜ pending |
| 08-01-02 | 01 | 0 | SM2-02 | unit | `npx jest lib/sr/sm2plus.test.ts` | No — W0 | ⬜ pending |
| 08-01-03 | 01 | 0 | SM2-03 | unit | `npx jest lib/sr/sm2plus.test.ts` | No — W0 | ⬜ pending |
| 08-01-04 | 01 | 0 | SM2-05 | unit | `npx jest lib/sr/sm2plus.test.ts` | No — W0 | ⬜ pending |
| 08-02-01 | 02 | 1 | HIFZ-05 | unit | `npx jest services/hifzService.test.ts` | No — W0 | ⬜ pending |
| 08-02-02 | 02 | 1 | REVW-01 | unit | `npx jest services/hifzService.test.ts` | No — W0 | ⬜ pending |
| 08-03-01 | 03 | 1 | HIFZ-01 | manual | Visual verification on device | N/A | ⬜ pending |
| 08-03-02 | 03 | 1 | HIFZ-02 | manual | Visual verification on device | N/A | ⬜ pending |
| 08-04-01 | 04 | 2 | REVW-02 | manual | Visual verification on device | N/A | ⬜ pending |
| 08-04-02 | 04 | 2 | SESS-01 | manual | Visual verification on device | N/A | ⬜ pending |
| 08-04-03 | 04 | 2 | SESS-02 | manual | Visual verification on device | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lawh-mobile/lib/sr/sm2plus.test.ts` — SM-2+ algorithm unit tests (SM2-01, SM2-02, SM2-03, SM2-05)
- [ ] `lawh-mobile/__tests__/services/hifzService.test.ts` — hifzService SQLite CRUD tests (HIFZ-05, REVW-01)
- [ ] expo-sqlite mock setup for jest (SQLite not available in test environment)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 114-surah grid renders with correct colors | HIFZ-01 | Visual layout, color coding | Open Hifz tab, verify 5-column grid, verify status colors |
| Per-ayah strength bars in bottom sheet | HIFZ-02 | Visual component + interaction | Tap surah card, verify bottom sheet with strength bars |
| Review session blur/reveal flow | REVW-02 | Requires device interaction | Start review, verify blur overlay, tap Reveal, verify grade bar |
| New memorization session flow | SESS-01 | Requires device interaction | Select unmemorized ayahs, verify visible text, mark readiness |
| Review session from queue | SESS-02 | End-to-end flow | Tap review badge, verify queue loads, complete session |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

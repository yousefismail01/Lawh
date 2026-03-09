---
phase: 9
slug: level-adaptive-guided-daily-session-ui-with-heatmap-dhor-cycle-tracker-and-session-flow
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (via Expo) |
| **Config file** | lawh-mobile/jest.config.js or package.json jest config |
| **Quick run command** | `cd lawh-mobile && npx jest --testPathPattern=algorithm --no-coverage -x` |
| **Full suite command** | `cd lawh-mobile && npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd lawh-mobile && npx jest --testPathPattern=algorithm --no-coverage -x`
- **After every plan wave:** Run `cd lawh-mobile && npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | P9-01 | unit | `npx jest --testPathPattern=session-flow -x` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | P9-02 | unit | `npx jest --testPathPattern=level-calculator -x` | ✅ | ⬜ pending |
| 09-01-03 | 01 | 1 | P9-03 | unit | `npx jest --testPathPattern=heatmap -x` | ❌ W0 | ⬜ pending |
| 09-01-04 | 01 | 1 | P9-04 | unit | `npx jest --testPathPattern=dhor-scheduler -x` | ✅ | ⬜ pending |
| 09-01-05 | 01 | 1 | P9-05 | unit | `npx jest --testPathPattern=sabaq-throttle -x` | ✅ | ⬜ pending |
| 09-01-06 | 01 | 1 | P9-06 | unit | `npx jest --testPathPattern=quality-rating -x` | ❌ W0 | ⬜ pending |
| 09-01-07 | 01 | 1 | P9-07 | unit | `npx jest --testPathPattern=missed-day -x` | ❌ W0 | ⬜ pending |
| 09-01-08 | 01 | 1 | P9-08 | unit | `npx jest --testPathPattern=level-calculator -x` | ✅ | ⬜ pending |
| 09-01-09 | 01 | 1 | P9-09 | unit | `npx jest --testPathPattern=session-summary -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/algorithm/__tests__/session-flow.test.ts` — stubs for P9-01 (state machine transitions)
- [ ] `components/hifz/__tests__/heatmap.test.ts` — stubs for P9-03 (color mapping logic)
- [ ] `stores/__tests__/madinahHifzStore.test.ts` — stubs for P9-06, P9-07 (quality update, missed days)
- [ ] `components/session/__tests__/session-summary.test.ts` — stubs for P9-09 (summary aggregation)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Heatmap visual rendering (SVG colors) | P9-03 | Visual verification | Open hifz tab, verify 604-page grid renders with correct juz colors |
| Session flow screen transitions | P9-01 | Navigation UX | Start a session, complete rating flow, verify screen transitions |
| Level-adaptive card weights | P9-02 | Visual layout | Compare session card at different levels, verify weight changes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

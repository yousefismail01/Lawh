---
phase: 9
slug: level-adaptive-guided-daily-session-ui-with-heatmap-dhor-cycle-tracker-and-session-flow
status: draft
nyquist_compliant: true
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

- **After every task commit:** Run `cd lawh-mobile && npx tsc --noEmit --pretty 2>&1 | head -30`
- **After every plan wave:** Run `cd lawh-mobile && npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirements | Test Type | Automated Command | Status |
|---------|------|------|--------------|-----------|-------------------|--------|
| 09-01-T1 | 01 | 1 | P9-06, P9-07, P9-08, P9-09 | typecheck | `cd lawh-mobile && npx tsc --noEmit --pretty 2>&1 \| head -30` | pending |
| 09-01-T2 | 01 | 1 | P9-06, P9-09 | typecheck | `cd lawh-mobile && npx tsc --noEmit --pretty 2>&1 \| head -30` | pending |
| 09-02-T1 | 02 | 2 | P9-01, P9-02, P9-05 | typecheck | `cd lawh-mobile && npx tsc --noEmit --pretty 2>&1 \| head -30` | pending |
| 09-02-T2 | 02 | 2 | P9-01, P9-06 | typecheck | `cd lawh-mobile && npx tsc --noEmit --pretty 2>&1 \| head -30` | pending |
| 09-03-T1 | 03 | 2 | P9-03, P9-04 | typecheck | `cd lawh-mobile && npx tsc --noEmit --pretty 2>&1 \| head -30` | pending |
| 09-03-T2 | 03 | 2 | P9-05, P9-07, P9-08 | typecheck | `cd lawh-mobile && npx tsc --noEmit --pretty 2>&1 \| head -30` | pending |

*Status: pending · green · red · flaky*

---

## Nyquist Compliance Notes

All 6 tasks across 3 plans use `npx tsc --noEmit` as their automated verification command. This phase creates UI components and store extensions that are best verified by TypeScript compilation (type safety) plus manual visual inspection. The algorithm layer underneath (level-calculator, dhor-scheduler, sabaq-throttle) already has Jest tests from Phase 8 that cover the core logic.

No Wave 0 test stubs are needed because:
1. The store extensions (completeSession, getMissedDays) are thin wiring over already-tested algorithm functions
2. The UI components (HeatmapGrid, QualityRating, etc.) are presentation-only with no testable business logic beyond what TypeScript catches
3. Existing algorithm tests (`npx jest --testPathPattern=algorithm`) serve as regression guards

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Heatmap visual rendering (SVG colors) | P9-03 | Visual verification | Open hifz tab, verify 604-page grid renders with correct juz colors |
| Session flow screen transitions | P9-01 | Navigation UX | Start a session, complete rating flow, verify screen transitions |
| Level-adaptive card weights | P9-02 | Visual layout | Compare session card at different levels, verify weight changes |
| Quality rating haptic feedback | P9-06 | Device haptic | Tap each rating button on physical device, verify haptic fires |
| Level transition modal | P9-08 | Modal UX | Trigger level change, verify comparison table accuracy |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

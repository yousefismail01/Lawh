---
phase: 6
slug: mushaf-fullscreen-mode-with-tap-toggle-ui-menu-navigation-and-surah-glossary
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (via expo) |
| **Config file** | lawh-mobile/jest.config.js or package.json jest config |
| **Quick run command** | `cd lawh-mobile && npx jest --passWithNoTests` |
| **Full suite command** | `cd lawh-mobile && npx jest --passWithNoTests` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd lawh-mobile && npx jest --passWithNoTests`
- **After every plan wave:** Run `cd lawh-mobile && npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | TBD | TBD | TBD | TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Note: Task IDs and verification map will be populated after plans are created.*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements.

*Phase 6 is primarily UI/UX work — validation focuses on manual verification and component rendering.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Chrome toggle on tap | Fullscreen mode | Gesture interaction requires device testing | Tap mushaf page → chrome hides; tap again → chrome shows |
| Status bar hide/show | Fullscreen mode | Native status bar behavior | Verify status bar hides with chrome, reappears with chrome |
| Page swipe doesn't trigger chrome | Immersive mode | Gesture distinction requires device testing | Swipe pages with chrome hidden → chrome stays hidden |
| Auto-hide after 5s | Chrome timeout | Timing behavior requires device testing | Show chrome → wait 5s → chrome auto-hides |
| Menu icon → Home hub navigation | Navigation | Route transition requires device testing | Tap hamburger → navigates to Home hub; back → mushaf |
| Contents screen surah list | Glossary | ScrollView + SectionList behavior | Open contents → verify surahs grouped by juz, tap surah → jumps to page |
| Juz index quick jump | Glossary | Touch interaction on vertical index | Tap juz number in right-edge index → list scrolls to that juz |
| Quarters tab display | Glossary | Layout verification | Switch to Quarters tab → verify hizb/quarter breakdown displayed |

*Phase 6 is heavily UI/interaction-focused — most verification is manual.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

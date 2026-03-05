---
phase: 7
slug: expanded-footer-with-reading-layout-selector-microphone-placeholder-and-ayah-long-press-action-sheet-with-haptic-feedback
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest + @testing-library/react-native ^13.3.3 |
| **Config file** | jest-expo in package.json |
| **Quick run command** | `npx jest --testPathPattern=mushaf --bail` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=mushaf --bail`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | Footer layout | unit | `npx jest MushafFooter --bail` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | Settings store | unit | `npx jest settingsStore --bail` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 1 | Layout selector | unit | `npx jest LayoutSelectorPopover --bail` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 1 | Translation parser | unit | `npx jest translationData --bail` | ❌ W0 | ⬜ pending |
| 07-03-01 | 03 | 2 | Action sheet haptics | unit (mocked) | `npx jest AyahActionSheet --bail` | ❌ W0 | ⬜ pending |
| 07-03-02 | 03 | 2 | Audio playback | unit (mocked) | `npx jest AyahAudioPlayer --bail` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/components/mushaf/MushafFooter.test.tsx` — footer rendering with two rows and blur
- [ ] `__tests__/components/mushaf/LayoutSelectorPopover.test.tsx` — 3 modes + tajweed toggle
- [ ] `__tests__/lib/data/translationData.test.ts` — JSON parsing with footnote objects
- [ ] `__tests__/stores/settingsStore.test.ts` — new readingMode/tajweedEnabled fields
- [ ] `__tests__/components/mushaf/AyahActionSheet.test.tsx` — haptic triggers on open/tap
- [ ] `__tests__/components/mushaf/AyahAudioPlayer.test.tsx` — audio playback with seek

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Frosted glass blur visual | Footer layout | Visual quality subjective | Open mushaf, trigger chrome, verify blur over content |
| Haptic feedback feel | Action sheet | Physical hardware feedback | Long-press ayah, feel medium haptic; tap action, feel light haptic |
| Audio playback quality | Play Audio | Streaming audio verification | Long-press ayah, tap Play Audio, verify Alafasy recitation plays |
| Card mode reading position | Layout selector | Navigation state continuity | Switch to card mode, verify cards start from current page |
| Mic button toast | Mic placeholder | UI animation/timing | Tap mic, verify "coming soon" toast appears and auto-dismisses |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

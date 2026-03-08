---
phase: 02
slug: audio-pipeline-and-core-ai
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 7.x (server) / jest 29.x (mobile) |
| **Config file** | lawh-api/pytest.ini / lawh-mobile/jest.config.js |
| **Quick run command** | `cd lawh-api && pytest -x -q` / `cd lawh-mobile && npx jest --bail` |
| **Full suite command** | `cd lawh-api && pytest --cov` / `cd lawh-mobile && npx jest` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | AUDP-01 | integration | `npx jest --testPathPattern=recording` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AUDP-02 | unit | `pytest -k test_wav_validation` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AUDP-03 | integration | `npx jest --testPathPattern=offline` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AUDP-04 | integration | `npx jest --testPathPattern=interruption` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AIRC-01 | unit | `pytest -k test_whisper` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AIRC-02 | unit | `pytest -k test_alignment` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AIRC-03 | unit | `pytest -k test_passage_detection` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AIRC-04 | unit | `pytest -k test_scoring` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AIRC-05 | unit | `pytest -k test_jwt` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AIRC-06 | integration | `pytest -k test_recitation_endpoint` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AIRC-07 | unit | `pytest -k test_error_handling` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AIRC-08 | unit | `pytest -k test_supabase_write` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | RIWY-03 | unit | `pytest -k test_riwayah` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lawh-api/tests/conftest.py` — shared fixtures (mock Supabase, mock Whisper model)
- [ ] `lawh-api/tests/test_wav_validation.py` — stubs for AUDP-02
- [ ] `lawh-api/tests/test_jwt.py` — stubs for AIRC-05
- [ ] `lawh-api/tests/test_whisper.py` — stubs for AIRC-01
- [ ] `lawh-api/tests/test_alignment.py` — stubs for AIRC-02
- [ ] `lawh-api/tests/test_passage_detection.py` — stubs for AIRC-03
- [ ] `lawh-api/tests/test_scoring.py` — stubs for AIRC-04
- [ ] `lawh-api/tests/test_recitation_endpoint.py` — stubs for AIRC-06
- [ ] `lawh-api/tests/test_error_handling.py` — stubs for AIRC-07
- [ ] `lawh-api/tests/test_supabase_write.py` — stubs for AIRC-08
- [ ] `lawh-api/tests/test_riwayah.py` — stubs for RIWY-03
- [ ] `lawh-mobile/__tests__/recording/` — stubs for AUDP-01, AUDP-03, AUDP-04
- [ ] `pytest` + `pytest-cov` — install in lawh-api

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Audio recording on real device | AUDP-01 | Hardware mic access | Record 10s of Quran on iOS + Android device |
| Phone call interruption handling | AUDP-04 | OS-level interruption | Start recording, trigger incoming call, verify audio saved |
| Offline queue + sync | AUDP-03 | Network state simulation | Enable airplane mode, record, disable, verify upload |
| Waveform visualization | AUDP-01 | Visual UI behavior | Verify waveform animates during recording |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

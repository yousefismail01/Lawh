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
| TBD | TBD | TBD | AUDP-01 | manual | *See Manual-Only Verifications* | N/A | pending |
| TBD | TBD | TBD | AUDP-02 | unit | `npx jest __tests__/services/offlineQueue.test.ts -x` | W0 | pending |
| TBD | TBD | TBD | AUDP-03 | manual | *See Manual-Only Verifications* | N/A | pending |
| TBD | TBD | TBD | AUDP-04 | unit | `python -m pytest tests/test_audio_validation.py -x` | W0 | pending |
| TBD | TBD | TBD | AIRC-01 | integration | `pytest -k test_transcription` | W0 | pending |
| TBD | TBD | TBD | AIRC-02 | unit | `pytest -k test_word_differ` | W0 | pending |
| TBD | TBD | TBD | AIRC-03 | unit | `pytest -k test_word_differ` | W0 | pending |
| TBD | TBD | TBD | AIRC-04 | unit | `pytest -k test_word_differ` | W0 | pending |
| TBD | TBD | TBD | AIRC-05 | unit | `pytest -k test_scoring` | W0 | pending |
| TBD | TBD | TBD | AIRC-06 | integration | `pytest -k test_supabase_write` | W0 | pending |
| TBD | TBD | TBD | AIRC-07 | unit | `pytest -k test_auth` | W0 | pending |
| TBD | TBD | TBD | AIRC-08 | integration | `pytest -k test_model_loading` | W0 | pending |
| TBD | TBD | TBD | RIWY-03 | unit | `pytest -k test_riwayah` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Server-side (created in Plan 02-01 Task 1):
- [ ] `lawh-api/pytest.ini` — pytest configuration
- [ ] `lawh-api/tests/conftest.py` — shared fixtures (mock JWT, WAV generators)

Server-side test files (created across Plans 02-01 and 02-02):
- [ ] `lawh-api/tests/test_auth.py` — JWT auth tests (Plan 02-01 Task 2)
- [ ] `lawh-api/tests/test_audio_validation.py` — audio format validation tests (Plan 02-01 Task 2)
- [ ] `lawh-api/tests/test_riwayah.py` — riwayah gating tests (Plan 02-01 Task 2)
- [ ] `lawh-api/tests/test_arabic_normalize.py` — Arabic normalization tests (Plan 02-02 Task 1)
- [ ] `lawh-api/tests/test_word_differ.py` — word differ tests (Plan 02-02 Task 1)
- [ ] `lawh-api/tests/test_scoring.py` — scoring tests (Plan 02-02 Task 1)
- [ ] `lawh-api/tests/test_passage_detector.py` — passage detector tests (Plan 02-02 Task 1)
- [ ] `lawh-api/tests/test_transcription.py` — transcription service tests with mock Whisper (Plan 02-02 Task 2)
- [ ] `lawh-api/tests/test_supabase_write.py` — Supabase writer tests (Plan 02-02 Task 2)
- [ ] `lawh-api/tests/test_model_loading.py` — model loading tests (Plan 02-01 Task 3)

Mobile-side test files (created in Plan 02-03 Task 2):
- [ ] `lawh-mobile/__tests__/services/offlineQueue.test.ts` — offline queue tests

Dependencies:
- [ ] `pytest` + `pytest-timeout` + `pytest-asyncio` — install via lawh-api/requirements-dev.txt

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

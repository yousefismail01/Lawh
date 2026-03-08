# Phase 2: Audio Pipeline and Core AI - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

User can record a recitation on both iOS and Android, the AI inference server transcribes it, identifies which Quran passage was recited, performs word-level diff against the expected text, and returns correctness feedback (correct/wrong/skipped/added/tashkeel error) with an overall accuracy score. Recordings made offline queue locally and upload automatically when connection restores. The FastAPI server validates Supabase JWT on every request. Tajweed rule classification is Phase 3 — this phase covers word-level accuracy only.

</domain>

<decisions>
## Implementation Decisions

### Recording UX
- Tap mic button to start recording, tap again to stop (simple toggle)
- Mic button already exists as placeholder in mushaf footer (Phase 7)
- While recording: animated real-time audio waveform visualization above the footer with elapsed time counter
- No ayah pre-selection required — the AI auto-detects which passage the user is reciting by transcribing and matching against the full Quran text
- On interruption (phone call on iOS, app backgrounded): audio auto-saves up to the interruption point; when user returns, offer to continue recording or submit what was captured; no data loss

### Results display
- Word-level feedback displayed inline on the mushaf text — color highlights overlaid directly on the Quran words the user recited
- 4-color system: Green = correct, Red = wrong word, Orange = tashkeel error (right word, wrong diacritics), Gray = skipped. Added words noted separately
- Accuracy score and word-count breakdown shown in a bottom sheet that appears after analysis completes
- Post-result actions: "Try Again" (re-record same passage) and "Done" (clear highlights, return to reading) — no auto-advance to next passage

### Offline queue behavior
- When recording offline: simple toast confirmation "Saved — will analyze when online"
- Recordings queue locally and auto-upload silently when connection restores
- No queue badge or queue list UI in this phase — minimal approach
- On upload failure: auto-retry up to 3 times with backoff, then mark as failed; recording never deleted, user can retry manually later

### AI response loading
- User stays on mushaf page during analysis
- Subtle overlay shows progress steps: "Uploading..." → "Analyzing..." → highlights appear inline
- 15-second timeout; if no response, auto-retry once; if still fails, show friendly error
- Error messages: user-friendly ("Couldn't analyze your recitation") with expandable detail on tap showing error type (timeout, server error, audio issue)
- Recording is never lost on error — "Retry" and "Save for later" options always available

### Claude's Discretion
- Waveform visualization library choice and visual design
- Quran passage detection algorithm (matching transcription to ayah text)
- Audio file format details beyond 16kHz mono WAV spec
- Bottom sheet layout and score presentation design
- Exact retry backoff timing for offline queue
- FastAPI endpoint structure and request/response schema
- ML model loading and inference pipeline architecture
- How "continue recording after interruption" is presented (modal? banner?)

</decisions>

<specifics>
## Specific Ideas

- User should be able to just recite freely and the AI detects where they are in the Quran — no pre-selection of ayahs. This means the server needs a passage identification step before word-level diffing.
- The inline mushaf highlights keep the reading experience central — results appear in context, not on a separate screen
- Future offline AI capability planned (user mentioned) — for now, offline recordings queue for server processing

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@mykin-ai/expo-audio-stream`: specified in CLAUDE.md for 16kHz mono WAV recording (not yet installed)
- `expo-audio` and `expo-av`: already installed, used for Alafasy playback in AyahAudioPlayer
- `audioService.ts`: existing playback service with caching pattern — recording service can follow same structure
- `types/audio.ts`: has Reciter/AudioSegment types for playback — needs recording types added
- `@tanstack/react-query`: already installed, designated for inference API calls (Phase 1 decision)
- `expo-file-system`: already installed, can handle local audio file storage for offline queue
- `MushafFooter`: mic button placeholder exists, needs to become functional

### Established Patterns
- Zustand stores for client state (settingsStore, authStore) — add recordingStore for recording state
- TanStack Query for server API calls — use for inference requests
- Service layer pattern (quranService, audioService) — add inferenceService
- Toast/banner pattern used throughout app for notifications

### Integration Points
- FastAPI skeleton (`lawh-api/app/main.py`): has Riwayah enum, CORS, /health — needs inference endpoints added
- `lawh-api/app/routers/`: empty, ready for inference router
- `lawh-api/app/core/config.py`: exists for configuration
- Supabase client in mobile app: for JWT token to send with inference requests
- MushafScreen/MushafPage components: need to accept and render word-level highlight overlays
- V4 per-page fonts with CPAL palettes: highlights may need to work alongside COLRv1 rendering

</code_context>

<deferred>
## Deferred Ideas

- Offline AI for local detection — user plans to implement on-device AI that can detect some recitation aspects without server. Future phase.
- Auto-advance to next ayah range after results — decided against for Phase 2, could add in session modes (Phase 4)

</deferred>

---

*Phase: 02-audio-pipeline-and-core-ai*
*Context gathered: 2026-03-08*

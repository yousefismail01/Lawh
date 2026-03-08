# Phase 2: Audio Pipeline and Core AI - Research

**Researched:** 2026-03-08
**Domain:** Audio recording (React Native/Expo), ML inference (FastAPI/Whisper), Arabic text alignment
**Confidence:** HIGH

## Summary

This phase bridges the mobile app and the AI inference server. The mobile side records 16kHz mono WAV audio using `@mykin-ai/expo-audio-stream`, manages offline queuing with `expo-file-system` + `@react-native-community/netinfo`, and displays word-level correctness highlights inline on the mushaf. The server side uses `faster-whisper` (CTranslate2-backed Whisper inference) with the `tarteel-ai/whisper-base-ar-quran` model to transcribe recitations, then runs a word-level diff against the expected Quran text using Arabic-specific normalization (already implemented in `lib/arabic/normalize.ts`). JWT validation uses PyJWT with the Supabase JWT secret. Results are written to Supabase via service role key.

The existing codebase provides strong foundations: the FastAPI skeleton with Riwayah enum, Supabase DB schema with `recitation_sessions`, `recitation_attempts`, and `tajweed_violation_log` tables, Arabic normalization utilities, the MicPlaceholderButton ready to be replaced, and the established Zustand/TanStack Query/service-layer patterns.

**Primary recommendation:** Use `faster-whisper` with int8 quantization for the Whisper model on the T4 GPU (4x faster, half the memory vs vanilla transformers). Convert the HuggingFace model to CTranslate2 format as a build step. On mobile, use `@mykin-ai/expo-audio-stream` v0.3.5 for recording and build a simple file-based offline queue with NetInfo connectivity detection.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Recording UX: Tap mic button to start/stop (simple toggle); animated real-time audio waveform visualization above footer with elapsed time counter
- No ayah pre-selection: AI auto-detects which passage the user is reciting by transcribing and matching against the full Quran text
- On interruption (phone call, app background): audio auto-saves up to interruption point; offer to continue or submit what was captured
- Results display: 4-color inline highlights on mushaf text (Green=correct, Red=wrong, Orange=tashkeel error, Gray=skipped); added words noted separately
- Accuracy score and word-count breakdown in bottom sheet after analysis
- Post-result actions: "Try Again" and "Done" only
- Offline queue: toast confirmation, silent auto-upload, no queue UI, 3 retries with backoff, never delete recordings
- AI response loading: user stays on mushaf; progress overlay "Uploading..." then "Analyzing..."; 15-second timeout with one auto-retry; expandable error detail; "Retry" and "Save for later" always available

### Claude's Discretion
- Waveform visualization library choice and visual design
- Quran passage detection algorithm (matching transcription to ayah text)
- Audio file format details beyond 16kHz mono WAV spec
- Bottom sheet layout and score presentation design
- Exact retry backoff timing for offline queue
- FastAPI endpoint structure and request/response schema
- ML model loading and inference pipeline architecture
- How "continue recording after interruption" is presented (modal? banner?)

### Deferred Ideas (OUT OF SCOPE)
- Offline AI for local detection (future phase)
- Auto-advance to next ayah range after results (Phase 4 session modes)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUDP-01 | Record 16kHz mono WAV on iOS and Android | @mykin-ai/expo-audio-stream with sampleRate:16000, channels:1, encoding:pcm_16bit |
| AUDP-02 | Offline queue with auto-upload on reconnect | expo-file-system for local storage + @react-native-community/netinfo for connectivity |
| AUDP-03 | iOS audio interruption handling without data loss | expo-audio-stream's onAudioStream callback saves chunks incrementally; AVAudioSession interruption handling |
| AUDP-04 | Server validates audio format, rejects invalid with 422 | FastAPI endpoint validates WAV header (sample rate, channels, encoding) before inference |
| AIRC-01 | Whisper ASR with tarteel-ai/whisper-base-ar-quran | faster-whisper with CTranslate2-converted model, int8 quantization on T4 GPU |
| AIRC-02 | Word-level diff with Arabic normalization | Port normalize.ts logic to Python; sliding-window passage identification + edit distance alignment |
| AIRC-03 | Word classification (correct/wrong/skipped/added) | Custom diff algorithm comparing normalized transcription against expected text with position tracking |
| AIRC-04 | Tashkeel errors flagged separately | Compare with and without diacritics: if normalized match but full-text mismatch, flag as tashkeel error |
| AIRC-05 | Overall accuracy score (word 70%, tajweed 30%) | Server-side calculation; tajweed component is 0 in Phase 2 (Phase 3), so effective score = word accuracy only |
| AIRC-06 | Results written to Supabase via service role key | supabase-py client with service_role key writes to recitation_sessions + recitation_attempts tables |
| AIRC-07 | JWT validation on every request, user_id from claims | PyJWT decode with supabase_jwt_secret, audience="authenticated", algorithms=["HS256"], extract sub claim |
| AIRC-08 | All ML models run int8 on T4 GPU simultaneously | faster-whisper int8_float16 compute type; Phase 2 only has 1 model (Whisper), others are Phase 3 |
| RIWY-03 | Inference accepts riwayah, errors for unsupported | FastAPI Riwayah enum validation already in skeleton; return 422 for non-hafs |
</phase_requirements>

## Standard Stack

### Core - Mobile (Recording & Offline Queue)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @mykin-ai/expo-audio-stream | 0.3.5 | Audio recording with streaming callbacks | Specified in CLAUDE.md; native module for 16kHz mono PCM; real-time audio level for waveform |
| @react-native-community/netinfo | (Expo SDK 55 bundled) | Network connectivity detection | De facto standard for RN connectivity; Expo SDK compatible; event-driven API |
| expo-file-system | ~55.0.10 | Local audio file storage for offline queue | Already installed; provides documentDirectory for persistent storage |
| react-native-reanimated | ^4.2.1 | Waveform animation | Already installed; needed for smooth real-time waveform visualization |
| @tanstack/react-query | ^5.90.21 | Inference API calls with retry/caching | Already installed; established pattern in project for server calls |
| zustand | ^5.0.11 | Recording state management | Already installed; established pattern (authStore, settingsStore) |

### Core - Server (FastAPI Inference)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| faster-whisper | latest (1.1.x) | Whisper inference via CTranslate2 | 4x faster than transformers, int8 GPU support, word-level timestamps |
| ctranslate2 | latest | CTranslate2 runtime for faster-whisper | Required by faster-whisper; CUDA 12 + cuDNN 9 for T4 GPU |
| PyJWT | 2.x | Supabase JWT validation | Lightweight, well-maintained; decode HS256 tokens with audience verification |
| python-multipart | latest | File upload handling | Required by FastAPI for UploadFile type |
| supabase | 2.4.0 | Write results to Supabase | Already in requirements.txt |
| librosa | latest | Audio loading and resampling | Standard for audio preprocessing; loads WAV, validates format |
| soundfile | latest | WAV file reading/validation | Required by librosa; validates WAV headers |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-svg | ^15.15.3 | Waveform visualization rendering | Already installed; SVG paths for waveform display |
| @gorhom/bottom-sheet | latest | Results bottom sheet | Consider if existing modal pattern is insufficient; established RN bottom sheet |
| numpy | latest | Array operations for audio/text processing | Standard scientific computing; used by faster-whisper internally |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| faster-whisper | transformers + torch | 4x slower, 2x more memory; only advantage is simpler model loading |
| @mykin-ai/expo-audio-stream | expo-audio (built-in) | expo-audio lacks streaming callbacks and 16kHz recording configuration |
| PyJWT | python-jose | python-jose has better error messages but is less maintained; PyJWT is more standard |
| librosa | soundfile only | librosa adds resampling capability if audio needs format conversion |

**Installation (mobile):**
```bash
cd lawh-mobile && npx expo install @mykin-ai/expo-audio-stream @react-native-community/netinfo
```

**Installation (server):**
```bash
pip install faster-whisper PyJWT python-multipart librosa soundfile
```

**Dockerfile update needed:** Base image must change to NVIDIA CUDA image for GPU support.

## Architecture Patterns

### Recommended Project Structure

```
lawh-mobile/
├── services/
│   ├── recordingService.ts      # Audio recording lifecycle
│   └── inferenceService.ts      # API calls to FastAPI
├── stores/
│   └── recordingStore.ts        # Recording state (idle/recording/uploading/analyzing)
├── hooks/
│   ├── useRecording.ts          # Hook wrapping recording service
│   └── useInferenceResult.ts    # TanStack Query hook for results
├── components/mushaf/
│   ├── RecordButton.tsx         # Replaces MicPlaceholderButton
│   ├── WaveformVisualizer.tsx   # Real-time audio waveform
│   ├── RecitationOverlay.tsx    # Progress/results overlay on mushaf
│   └── ResultsBottomSheet.tsx   # Score breakdown sheet
├── lib/
│   ├── audio/
│   │   ├── offlineQueue.ts      # File-based offline queue manager
│   │   └── audioValidator.ts    # Client-side WAV validation
│   └── arabic/
│       └── normalize.ts         # ALREADY EXISTS - reuse for client-side preview
├── types/
│   └── recitation.ts            # Recording, inference result, word result types

lawh-api/
├── app/
│   ├── main.py                  # EXISTING - add router include
│   ├── core/
│   │   ├── config.py            # EXISTING - add jwt_secret, model_path
│   │   ├── auth.py              # JWT validation dependency
│   │   └── models.py            # ML model singleton loader
│   ├── routers/
│   │   └── inference.py         # POST /inference/recitation endpoint
│   ├── services/
│   │   ├── transcription.py     # Whisper transcription wrapper
│   │   ├── passage_detector.py  # Identifies which ayahs were recited
│   │   ├── word_differ.py       # Word-level diff with classification
│   │   └── arabic_normalize.py  # Python port of normalize.ts
│   └── schemas/
│       └── inference.py         # Pydantic request/response models
├── requirements.txt             # EXISTING - add new deps
├── Dockerfile                   # EXISTING - change to CUDA base image
└── scripts/
    └── convert_model.py         # CTranslate2 model conversion script
```

### Pattern 1: Recording State Machine

**What:** Zustand store managing recording lifecycle as a finite state machine.
**When to use:** Always - recording has distinct states that must not overlap.

```typescript
type RecordingState =
  | { status: 'idle' }
  | { status: 'recording'; startedAt: number; duration: number; audioLevels: number[] }
  | { status: 'uploading'; filePath: string; progress: number }
  | { status: 'analyzing'; filePath: string }
  | { status: 'results'; result: RecitationResult }
  | { status: 'error'; error: string; filePath?: string }
```

### Pattern 2: Offline Queue with File System

**What:** Persist recorded audio files to expo-file-system documentDirectory with metadata JSON sidecar. NetInfo listener triggers upload when connectivity restores.
**When to use:** Every recording - save file first, then attempt upload.

```typescript
// Offline queue structure in documentDirectory
// recordings/
//   {uuid}.wav          - audio file
//   {uuid}.meta.json    - { surahId?, riwayah, createdAt, retryCount, status }

// On connectivity restore:
// 1. Scan recordings/ for status: 'pending'
// 2. Upload each sequentially
// 3. On success: update status to 'uploaded', keep file
// 4. On failure: increment retryCount, backoff if retryCount >= 3
```

### Pattern 3: FastAPI Dependency Injection for Auth

**What:** JWT validation as a FastAPI dependency that extracts user_id.
**When to use:** Every inference endpoint.

```python
# Source: Supabase JWT docs + FastAPI security patterns
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Extract and verify user_id from Supabase JWT."""
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.supabase_jwt_secret,
            audience="authenticated",
            algorithms=["HS256"],
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token claims")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Pattern 4: Passage Detection Algorithm

**What:** After Whisper transcribes the audio, identify which Quran passage the user recited.
**When to use:** Every inference request (user does not pre-select ayahs).

```
Algorithm:
1. Normalize transcription using Arabic normalization (strip tashkeel, unify hamza/alef)
2. Normalize all 6,236 ayahs from quran-text.json (pre-computed on server startup)
3. Sliding window search: for each candidate window of consecutive ayahs,
   compute edit distance ratio against the normalized transcription
4. Select the window with highest match ratio above threshold (e.g., 0.6)
5. Return matched ayah range (surah_id, start_ayah, end_ayah)

Optimization: Pre-build an inverted index of normalized words -> ayah locations
for fast candidate narrowing before full alignment.
```

### Pattern 5: Word-Level Diff with Classification

**What:** Compare transcription words against expected ayah words, classify each.
**When to use:** After passage detection identifies the target ayahs.

```
Algorithm:
1. Split expected text into words (preserving tashkeel)
2. Split transcription into words
3. Run sequence alignment (Levenshtein-based) on normalized versions
4. For each alignment pair:
   - Both present + normalized match + tashkeel match → CORRECT (green)
   - Both present + normalized match + tashkeel mismatch → TASHKEEL_ERROR (orange)
   - Both present + normalized mismatch → WRONG (red)
   - Expected word with no transcription match → SKIPPED (gray)
   - Transcription word with no expected match → ADDED (separate list)
5. Return word_results array with position, expected, transcribed, classification
```

### Anti-Patterns to Avoid

- **Recording without saving first:** Always persist to file system before attempting upload. Network can drop mid-upload.
- **Blocking UI during inference:** Use TanStack Query with async state; user stays on mushaf with subtle progress overlay.
- **Loading Quran text on every request:** Pre-load and cache the normalized Quran corpus in memory on server startup.
- **Using transformers directly for Whisper:** Use faster-whisper for 4x speed improvement on T4.
- **Trusting user-supplied user_id:** Always extract from verified JWT claims (sub field), never from request body.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Audio recording with streaming | Custom native module | @mykin-ai/expo-audio-stream | iOS/Android audio session management is complex; handles interruptions |
| Whisper inference | Raw transformers pipeline | faster-whisper (CTranslate2) | 4x faster, int8 quantization, word timestamps built-in |
| JWT validation | Manual token parsing | PyJWT with FastAPI HTTPBearer | Edge cases in JWT validation (expiry, audience, algorithm) are security-critical |
| Network connectivity detection | Polling fetch requests | @react-native-community/netinfo | Native APIs more reliable; event-driven; handles edge cases |
| Sequence alignment / diff | Character-by-character comparison | difflib.SequenceMatcher or python-Levenshtein | Proven algorithms handle insertions/deletions/substitutions correctly |
| Audio format validation | Manual byte parsing | soundfile/librosa | WAV format has many variants; libraries handle all of them |

**Key insight:** Audio recording, ML inference, and JWT validation all have subtle edge cases that custom implementations invariably get wrong. The libraries handle interruption recovery, quantized inference, and token expiry/audience/algorithm verification.

## Common Pitfalls

### Pitfall 1: iOS Audio Session Category Conflicts
**What goes wrong:** Recording fails silently or expo-av playback breaks because audio session categories conflict.
**Why it happens:** iOS only allows one audio session configuration at a time. If the app was playing Quran audio (expo-av), then tries to record, the session category must change.
**How to avoid:** Stop any playback before starting recording. Configure audio session for recording mode explicitly. Restore playback mode after recording stops.
**Warning signs:** Recording produces empty/silent files; playback stops working after recording.

### Pitfall 2: Arabic Normalization Mismatch Between Client and Server
**What goes wrong:** Words that should match don't, because the mobile normalize.ts and Python normalizer handle edge cases differently.
**Why it happens:** Unicode Arabic has many invisible characters, combining marks, and variant forms. Subtle differences in regex patterns produce different results.
**How to avoid:** Port the exact same normalization logic from normalize.ts to Python. Write cross-language test cases with the same input/output pairs. Use NFC normalization on both sides.
**Warning signs:** Unexpectedly low accuracy scores; words marked as wrong that sound correct.

### Pitfall 3: Whisper Hallucination on Short Audio
**What goes wrong:** Whisper generates plausible but incorrect Arabic text for very short recordings (<2 seconds) or silent/noisy audio.
**Why it happens:** Whisper is a generative model; it can produce fluent text from noise.
**How to avoid:** Set a minimum recording duration (e.g., 3 seconds). Validate audio energy level before sending to inference. Use Whisper's `no_speech_threshold` parameter.
**Warning signs:** Perfect-looking transcriptions from obviously bad audio.

### Pitfall 4: File Upload Size and Timeout
**What goes wrong:** Large recordings (>60 seconds) produce WAV files that exceed upload timeouts or server memory limits.
**Why it happens:** 16kHz mono 16-bit WAV is ~1.9 MB/minute. A 5-minute recording is ~9.5 MB.
**How to avoid:** Set a maximum recording duration (e.g., 5 minutes). Stream upload with progress tracking. Set appropriate FastAPI upload size limits and timeouts. Consider chunked upload for very long recordings.
**Warning signs:** Uploads timing out; server OOM on large files.

### Pitfall 5: Supabase JWT Secret vs JWKS
**What goes wrong:** JWT validation fails with cryptic errors.
**Why it happens:** Supabase uses HS256 with a shared secret (not RS256 with JWKS). The secret is found in Supabase project settings under API > JWT Secret. Forgetting to set `audience="authenticated"` causes validation failure.
**How to avoid:** Use HS256 algorithm explicitly. Always pass `audience="authenticated"`. Store JWT secret in server .env, never in mobile app.
**Warning signs:** All requests return 401; JWT decode throws "invalid audience" errors.

### Pitfall 6: CTranslate2 CUDA Version Mismatch
**What goes wrong:** faster-whisper crashes on startup with CUDA/cuDNN errors.
**Why it happens:** CTranslate2 requires specific CUDA 12 + cuDNN 9 versions. The T4 GPU driver must support CUDA 12.
**How to avoid:** Use NVIDIA's official CUDA 12 Docker base image. Pin ctranslate2 version. Test locally with `compute_type="int8"` on CPU before deploying to GPU.
**Warning signs:** ImportError or RuntimeError on `WhisperModel` initialization.

## Code Examples

### Recording Service (Mobile)
```typescript
// services/recordingService.ts
import { startRecording, stopRecording } from '@mykin-ai/expo-audio-stream'
import * as FileSystem from 'expo-file-system'
import { v4 as uuid } from 'uuid' // or use crypto.randomUUID

const RECORDINGS_DIR = `${FileSystem.documentDirectory}recordings/`

export const recordingService = {
  async start(onAudioLevel: (level: number) => void) {
    await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true })
    const fileId = uuid()
    const filePath = `${RECORDINGS_DIR}${fileId}.wav`

    const result = await startRecording({
      sampleRate: 16000,
      channels: 1,
      encoding: 'pcm_16bit',
      interval: 100, // callback every 100ms for waveform
      onAudioStream: (event) => {
        onAudioLevel(event.soundLevel)
      },
    })
    return { fileId, filePath, result }
  },

  async stop(): Promise<string> {
    const result = await stopRecording()
    // result contains the recorded audio file URI
    return result.fileUri
  },
}
```

### Inference API Call (Mobile)
```typescript
// services/inferenceService.ts
import { useAuthStore } from '@/stores/authStore'
import type { Riwayah } from '@/types/riwayah'

const API_BASE = process.env.EXPO_PUBLIC_INFERENCE_URL

interface InferenceResult {
  surah_id: number
  start_ayah: number
  end_ayah: number
  accuracy_score: number
  word_results: WordResult[]
}

interface WordResult {
  position: number
  expected: string
  transcribed: string | null
  status: 'correct' | 'wrong' | 'skipped' | 'added' | 'tashkeel_error'
}

export async function submitRecitation(
  filePath: string,
  riwayah: Riwayah,
): Promise<InferenceResult> {
  const session = useAuthStore.getState().session
  if (!session?.access_token) throw new Error('Not authenticated')

  const formData = new FormData()
  formData.append('audio', {
    uri: filePath,
    type: 'audio/wav',
    name: 'recitation.wav',
  } as any)
  formData.append('riwayah', riwayah)

  const response = await fetch(`${API_BASE}/inference/recitation`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `Server error: ${response.status}`)
  }

  return response.json()
}
```

### FastAPI Inference Endpoint (Server)
```python
# app/routers/inference.py
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from app.core.auth import get_current_user
from app.main import Riwayah, SUPPORTED_RIWAYAT
from app.services.transcription import transcribe_audio
from app.services.passage_detector import detect_passage
from app.services.word_differ import compute_word_diff
from app.schemas.inference import RecitationResponse

router = APIRouter(prefix="/inference", tags=["inference"])

@router.post("/recitation", response_model=RecitationResponse)
async def analyze_recitation(
    audio: UploadFile = File(...),
    riwayah: Riwayah = Form(...),
    user_id: str = Depends(get_current_user),
):
    # Validate riwayah
    if riwayah not in SUPPORTED_RIWAYAT:
        raise HTTPException(422, f"Riwayah '{riwayah.value}' not supported")

    # Validate audio format
    audio_bytes = await audio.read()
    validate_wav_format(audio_bytes)  # raises 422 if invalid

    # Transcribe
    transcription = transcribe_audio(audio_bytes)

    # Detect passage
    passage = detect_passage(transcription, riwayah)

    # Compute word-level diff
    word_results, accuracy = compute_word_diff(
        transcription, passage, riwayah
    )

    # Write results to Supabase (service role)
    await save_results(user_id, riwayah, passage, word_results, accuracy)

    return RecitationResponse(
        surah_id=passage.surah_id,
        start_ayah=passage.start_ayah,
        end_ayah=passage.end_ayah,
        accuracy_score=accuracy,
        word_results=word_results,
    )
```

### Model Loading Singleton (Server)
```python
# app/core/models.py
from faster_whisper import WhisperModel
from app.core.config import settings

_whisper_model = None

def get_whisper_model() -> WhisperModel:
    global _whisper_model
    if _whisper_model is None:
        _whisper_model = WhisperModel(
            settings.whisper_model_path,  # path to CTranslate2-converted model
            device=settings.device,       # "cuda" on EC2
            compute_type="int8_float16",  # int8 weights, float16 activations
        )
    return _whisper_model
```

### Arabic Normalization (Python port)
```python
# app/services/arabic_normalize.py
import re
import unicodedata

TASHKEEL_PATTERN = re.compile(r'[\u0610-\u061A\u064B-\u065F\u0670]')
TATWEEL = re.compile(r'\u0640')

HAMZA_SUBS = [
    (re.compile(r'\u0622'), '\u0627'),  # alef with madda -> alef
    (re.compile(r'\u0623'), '\u0627'),  # alef with hamza above -> alef
    (re.compile(r'\u0625'), '\u0627'),  # alef with hamza below -> alef
    (re.compile(r'\u0671'), '\u0627'),  # alef wasla -> alef
    (re.compile(r'\u0624'), '\u0648'),  # waw with hamza -> waw
    (re.compile(r'\u0626'), '\u064A'),  # ya with hamza -> ya
    (re.compile(r'\u0621'), ''),        # standalone hamza -> remove
]

TA_MARBUTA = re.compile(r'\u0629')
ALEF_MAQSURA = re.compile(r'\u0649')

def normalize_arabic(text: str) -> str:
    if not text:
        return ''
    s = TASHKEEL_PATTERN.sub('', text)
    s = TATWEEL.sub('', s)
    for pattern, replacement in HAMZA_SUBS:
        s = pattern.sub(replacement, s)
    s = TA_MARBUTA.sub('\u0647', s)
    s = ALEF_MAQSURA.sub('\u064A', s)
    return unicodedata.normalize('NFC', s).strip()
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| openai/whisper (transformers) | faster-whisper (CTranslate2) | 2023 | 4x faster, 2x less memory, int8 GPU support |
| expo-av Recording | @mykin-ai/expo-audio-stream | 2024 | Streaming callbacks, configurable sample rate, real-time audio levels |
| python-jose for JWT | PyJWT | 2024 | python-jose less maintained; PyJWT is standard |
| Manual polling for connectivity | @react-native-community/netinfo | Stable | Event-driven, native APIs, reliable |

**Deprecated/outdated:**
- `expo-av` Recording API: Still works but lacks streaming callbacks needed for real-time waveform
- `python-jose`: Less actively maintained than PyJWT; either works for HS256 but PyJWT is preferred
- Vanilla `openai/whisper`: Too slow for production; always use faster-whisper or whisper.cpp

## Open Questions

1. **Waveform visualization approach**
   - What we know: react-native-reanimated is available; @mykin-ai/expo-audio-stream provides `soundLevel` per interval
   - What's unclear: Whether to use SVG paths (react-native-svg) or Skia canvas or pure reanimated views for the waveform bars
   - Recommendation: Use simple animated View bars with reanimated shared values - lowest complexity, good enough for a small waveform above the footer

2. **Maximum recording duration**
   - What we know: 16kHz mono WAV = ~1.9 MB/min; Whisper handles up to 30 seconds natively (longer with chunking)
   - What's unclear: Whether to cap at 30s (Whisper segment) or allow longer with auto-chunking
   - Recommendation: Cap at 5 minutes (server splits into 30s chunks for Whisper); covers typical recitation of 5-15 ayahs

3. **Passage detection performance**
   - What we know: 6,236 ayahs to search against; edit distance is O(n*m)
   - What's unclear: Whether brute-force sliding window is fast enough or if indexing is needed
   - Recommendation: Pre-build inverted index of normalized words to ayah positions on startup; narrow candidates before alignment. Benchmark with profile data.

4. **Bottom sheet library**
   - What we know: Project doesn't currently use @gorhom/bottom-sheet; existing modal patterns work for simple sheets
   - What's unclear: Whether the results sheet needs gesture-based expansion or if a simple modal suffices
   - Recommendation: Start with a simple Animated.View + PanResponder bottom sheet; add @gorhom/bottom-sheet only if gesture complexity warrants it

5. **expo-audio-stream and Expo SDK 55 compatibility**
   - What we know: @mykin-ai/expo-audio-stream v0.3.5 was published recently and is actively maintained
   - What's unclear: Whether it's been tested with Expo SDK 55 / React Native 0.83
   - Recommendation: Install and test early in implementation; have expo-av Recording as fallback if compatibility issues arise

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework (mobile) | Jest 29 + jest-expo + @testing-library/react-native |
| Framework (server) | pytest (needs setup) |
| Config file (mobile) | `lawh-mobile/jest.config.js` |
| Config file (server) | `lawh-api/pytest.ini` (Wave 0) |
| Quick run command (mobile) | `cd lawh-mobile && npx jest --testPathPattern=__tests__/(audio\|services\|stores/recording) --bail` |
| Quick run command (server) | `cd lawh-api && python -m pytest tests/ -x --timeout=30` |
| Full suite command (mobile) | `cd lawh-mobile && npx jest` |
| Full suite command (server) | `cd lawh-api && python -m pytest tests/ --timeout=60` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUDP-01 | Recording produces 16kHz mono WAV | manual-only | Manual: record on device, verify WAV headers | N/A |
| AUDP-02 | Offline queue saves and auto-uploads | unit | `npx jest __tests__/services/offlineQueue.test.ts -x` | Wave 0 |
| AUDP-03 | iOS interruption saves audio | manual-only | Manual: trigger phone call during recording on iOS device | N/A |
| AUDP-04 | Server rejects invalid audio with 422 | unit | `python -m pytest tests/test_audio_validation.py -x` | Wave 0 |
| AIRC-01 | Whisper transcribes Arabic Quran audio | integration | `python -m pytest tests/test_transcription.py -x` | Wave 0 |
| AIRC-02 | Word diff with Arabic normalization | unit | `python -m pytest tests/test_word_differ.py -x` | Wave 0 |
| AIRC-03 | Words classified correct/wrong/skipped/added | unit | `python -m pytest tests/test_word_differ.py::test_classification -x` | Wave 0 |
| AIRC-04 | Tashkeel errors detected separately | unit | `python -m pytest tests/test_word_differ.py::test_tashkeel_error -x` | Wave 0 |
| AIRC-05 | Accuracy score calculated correctly | unit | `python -m pytest tests/test_scoring.py -x` | Wave 0 |
| AIRC-06 | Results written to Supabase | integration | `python -m pytest tests/test_supabase_write.py -x` | Wave 0 |
| AIRC-07 | JWT validation extracts user_id | unit | `python -m pytest tests/test_auth.py -x` | Wave 0 |
| AIRC-08 | Model loads with int8 on GPU | integration | `python -m pytest tests/test_model_loading.py -x` | Wave 0 |
| RIWY-03 | Unsupported riwayah returns 422 | unit | `python -m pytest tests/test_riwayah.py -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** Quick run command for affected domain (mobile or server)
- **Per wave merge:** Full suite for both mobile and server
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `lawh-api/pytest.ini` -- pytest configuration
- [ ] `lawh-api/tests/conftest.py` -- shared fixtures (mock Supabase client, test audio files)
- [ ] `lawh-api/tests/test_auth.py` -- covers AIRC-07
- [ ] `lawh-api/tests/test_audio_validation.py` -- covers AUDP-04
- [ ] `lawh-api/tests/test_word_differ.py` -- covers AIRC-02, AIRC-03, AIRC-04
- [ ] `lawh-api/tests/test_scoring.py` -- covers AIRC-05
- [ ] `lawh-api/tests/test_riwayah.py` -- covers RIWY-03
- [ ] `lawh-api/tests/fixtures/sample_recitation.wav` -- test audio file (short Al-Fatiha clip)
- [ ] `lawh-mobile/__tests__/services/offlineQueue.test.ts` -- covers AUDP-02
- [ ] `lawh-api/requirements-dev.txt` -- pytest, pytest-timeout, pytest-asyncio
- [ ] Framework install (server): `pip install pytest pytest-timeout pytest-asyncio`

## Sources

### Primary (HIGH confidence)
- [tarteel-ai/whisper-base-ar-quran](https://huggingface.co/tarteel-ai/whisper-base-ar-quran) - Model card, architecture, WER 5.75%, usage examples
- [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) - CTranslate2 backend, int8 quantization, word timestamps, conversion process
- [mykin-ai/expo-audio-stream](https://github.com/mykin-ai/expo-audio-stream) - Recording API, streaming callbacks, audio levels, v0.3.5
- [Supabase JWT docs](https://supabase.com/docs/guides/auth/jwts) - HS256 signing, JWT secret location
- [FastAPI security docs](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/) - HTTPBearer dependency pattern
- [@react-native-community/netinfo](https://docs.expo.dev/versions/latest/sdk/netinfo/) - Expo SDK integration, event-driven API

### Secondary (MEDIUM confidence)
- [Supabase JWT validation with FastAPI](https://dev.to/zwx00/validating-a-supabase-jwt-locally-with-python-and-fastapi-59jf) - PyJWT implementation pattern with audience="authenticated"
- [CTranslate2 model conversion](https://medium.com/@balaragavesh/converting-your-fine-tuned-whisper-model-to-faster-whisper-using-ctranslate2-b272063d3204) - ct2-transformers-converter workflow
- [Apple AVAudioSession interruptions](https://developer.apple.com/documentation/avfaudio/handling-audio-interruptions) - iOS interruption handling patterns

### Tertiary (LOW confidence)
- expo-audio-stream + Expo SDK 55 compatibility: not explicitly verified; package is actively maintained but SDK 55 testing is unconfirmed
- Passage detection algorithm performance: theoretical; needs benchmarking with real data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries verified from official sources; versions confirmed
- Architecture: HIGH - patterns follow established project conventions (Zustand, TanStack Query, service layer)
- Server inference pipeline: HIGH - faster-whisper + CTranslate2 is well-documented and widely used
- Passage detection algorithm: MEDIUM - algorithm is sound but performance characteristics need benchmarking
- iOS interruption handling: MEDIUM - expo-audio-stream supports it but specific behavior with expo SDK 55 needs device testing
- Pitfalls: HIGH - based on documented issues from official sources and known Whisper/audio session behaviors

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (30 days - stable technologies)

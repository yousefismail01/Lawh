// QUL API client — single source of truth for all Quran data
// Base: https://qul.tarteel.ai/api/v1/

const BASE_URL = 'https://qul.tarteel.ai/api/v1'
const MIN_DELAY_MS = 50
const MAX_RETRIES = 3

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(url: string): Promise<Response> {
  let attempt = 0
  while (true) {
    const response = await fetch(url)
    if (response.ok) return response

    if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
      attempt++
      const backoff = MIN_DELAY_MS * Math.pow(2, attempt)
      await delay(backoff)
      continue
    }

    throw new Error(`QUL API error: ${response.status} ${response.statusText} for ${url}`)
  }
}

// --- Response types ---

export interface QulChapter {
  id: number
  name_arabic: string
  name_simple: string // transliteration
  translated_name: { name: string } // English
  verses_count: number
  revelation_place: string // 'makkah' | 'madinah'
  revelation_order: number
  bismillah_pre: boolean
  pages: number[] // [startPage, endPage]
}

export interface QulWord {
  position: number
  page_number: number
  line_number: number
  text_uthmani: string
  text: string // V4 glyph code for per-page tajweed fonts
}

export interface QulVerse {
  id: number
  verse_key: string // "surah:ayah"
  page_number: number
  words: QulWord[]
}

interface QulChaptersResponse {
  chapters: QulChapter[]
}

interface QulVersesResponse {
  verses: QulVerse[]
  pagination: {
    per_page: number
    current_page: number
    total_pages: number
    total_records: number
  }
}

export interface QulTafsirEntry {
  resource_id: number
  text: string
}

export interface QulTranslationEntry {
  resource_id: number
  text: string
}

export interface QulReciter {
  id: number
  reciter_name: string
  style: string | null
}

export interface QulAudioSegment {
  verse_key: string
  url: string
  segments: number[][] // [start_ms, end_ms, word_position][]
}

// --- API methods ---

let lastCallTime = 0

async function rateLimit(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastCallTime
  if (elapsed < MIN_DELAY_MS) {
    await delay(MIN_DELAY_MS - elapsed)
  }
  lastCallTime = Date.now()
}

export async function fetchChapters(): Promise<QulChapter[]> {
  await rateLimit()
  const response = await fetchWithRetry(`${BASE_URL}/chapters`)
  const data: QulChaptersResponse = await response.json()
  return data.chapters
}

export async function fetchChapterVerses(
  chapterId: number,
  mushafId: number = 19,
): Promise<QulVerse[]> {
  await rateLimit()
  const url = `${BASE_URL}/chapters/${chapterId}/verses?words=true&mushaf=${mushafId}&per_page=286&word_fields=line_number,text_uthmani,page_number,position,text`
  const response = await fetchWithRetry(url)
  const data: QulVersesResponse = await response.json()
  return data.verses
}

export async function fetchTafsir(
  ayahKey: string,
  resourceId: number,
): Promise<QulTafsirEntry> {
  await rateLimit()
  const response = await fetchWithRetry(
    `${BASE_URL}/tafsirs/for_ayah/${ayahKey}?resource_id=${resourceId}`,
  )
  const data = await response.json()
  return data.tafsir
}

export async function fetchTranslation(
  ayahKey: string,
  resourceId: number,
): Promise<QulTranslationEntry> {
  await rateLimit()
  const response = await fetchWithRetry(
    `${BASE_URL}/translations/for_ayah/${ayahKey}?resource_id=${resourceId}`,
  )
  const data = await response.json()
  return data.translation
}

export async function fetchReciters(): Promise<QulReciter[]> {
  await rateLimit()
  const response = await fetchWithRetry(`${BASE_URL}/audio/ayah_recitations`)
  const data = await response.json()
  return data.reciters ?? data.recitations ?? []
}

export async function fetchAudioSegments(
  recitationId: number,
  surah: number,
): Promise<QulAudioSegment[]> {
  await rateLimit()
  const response = await fetchWithRetry(
    `${BASE_URL}/audio/ayah_segments/${recitationId}?surah=${surah}`,
  )
  const data = await response.json()
  return data.segments ?? data.audio_segments ?? []
}

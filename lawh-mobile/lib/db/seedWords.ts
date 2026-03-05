import { db } from './client'
import { words } from './schema'

const BATCH_SIZE = 200
const API_DELAY_MS = 100
const TOTAL_PAGES = 604
const API_BASE = 'https://api.quran.com/api/v4'

export type WordSeedProgress = {
  stage: 'words'
  percent: number
  currentPage: number
  totalPages: number
}

interface QuranApiWord {
  position: number
  page_number: number
  line_number: number
  text_uthmani: string
  char_type_name: string
}

interface QuranApiVerse {
  chapter_id: number
  verse_number: number
  words: QuranApiWord[]
}

interface QuranApiResponse {
  verses: QuranApiVerse[]
  pagination: {
    per_page: number
    current_page: number
    total_pages: number
    total_records: number
  }
}

/**
 * Seeds the local words table by fetching word-level data from quran.com API v4.
 * Iterates pages 1-604 and inserts all words with page/line positioning data.
 * Skips seeding if words already exist in the database.
 */
export async function seedWords(
  onProgress?: (progress: WordSeedProgress) => void
): Promise<void> {
  // Check if words already seeded
  const existing = await db.select().from(words).limit(1)
  if (existing.length > 0) return

  const pendingInserts: {
    surahId: number
    ayahNumber: number
    riwayah: string
    position: number
    pageNumber: number
    lineNumber: number
    textUthmani: string
    charType: string
  }[] = []

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    // Fetch all verses for this page (handle pagination)
    let apiPage = 1
    let hasMore = true

    while (hasMore) {
      const url = `${API_BASE}/verses/by_page/${page}?language=en&words=true&per_page=50&word_fields=line_number,text_uthmani,page_number,position&page=${apiPage}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`API error for page ${page}: ${response.status} ${response.statusText}`)
      }

      const data: QuranApiResponse = await response.json()

      for (const verse of data.verses) {
        for (const word of verse.words) {
          pendingInserts.push({
            surahId: verse.chapter_id,
            ayahNumber: verse.verse_number,
            riwayah: 'hafs',
            position: word.position,
            pageNumber: word.page_number,
            lineNumber: word.line_number,
            textUthmani: word.text_uthmani,
            charType: word.char_type_name,
          })
        }
      }

      // Check if more API pages needed for this mushaf page
      hasMore = apiPage < data.pagination.total_pages
      apiPage++

      if (hasMore) {
        await new Promise<void>((resolve) => setTimeout(resolve, API_DELAY_MS))
      }
    }

    // Flush batch when buffer is large enough
    if (pendingInserts.length >= BATCH_SIZE) {
      while (pendingInserts.length > 0) {
        const batch = pendingInserts.splice(0, BATCH_SIZE)
        await db.insert(words).values(batch)
        // Yield to event loop to prevent watchdog timeout
        await new Promise<void>((resolve) => setTimeout(resolve, 0))
      }
    }

    onProgress?.({
      stage: 'words',
      percent: (page / TOTAL_PAGES) * 100,
      currentPage: page,
      totalPages: TOTAL_PAGES,
    })

    // Rate limit between API calls
    await new Promise<void>((resolve) => setTimeout(resolve, API_DELAY_MS))
  }

  // Flush remaining inserts
  while (pendingInserts.length > 0) {
    const batch = pendingInserts.splice(0, BATCH_SIZE)
    await db.insert(words).values(batch)
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  }
}

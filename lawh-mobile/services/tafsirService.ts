import { fetchTafsir } from '@/lib/api/qul'
import type { TafsirEntry } from '@/types/tafsir'

// Default: Ibn Kathir (resource ID 169)
const DEFAULT_TAFSIR_RESOURCE = 169

// In-memory cache for session
const cache = new Map<string, TafsirEntry>()

export const tafsirService = {
  async getTafsir(
    surahId: number,
    ayahNumber: number,
    resourceId: number = DEFAULT_TAFSIR_RESOURCE,
  ): Promise<TafsirEntry> {
    const key = `${surahId}:${ayahNumber}:${resourceId}`
    const cached = cache.get(key)
    if (cached) return cached

    const ayahKey = `${surahId}:${ayahNumber}`
    const result = await fetchTafsir(ayahKey, resourceId)

    const entry: TafsirEntry = {
      resourceId: result.resource_id,
      text: result.text,
      verseKey: ayahKey,
    }

    cache.set(key, entry)
    return entry
  },

  clearCache() {
    cache.clear()
  },
}

import { fetchTranslation } from '@/lib/api/qul'
import type { TranslationEntry } from '@/types/translation'

// Default: Saheeh International (resource ID 20)
const DEFAULT_TRANSLATION_RESOURCE = 20

// In-memory cache for session
const cache = new Map<string, TranslationEntry>()

export const translationService = {
  async getTranslation(
    surahId: number,
    ayahNumber: number,
    resourceId: number = DEFAULT_TRANSLATION_RESOURCE,
  ): Promise<TranslationEntry> {
    const key = `${surahId}:${ayahNumber}:${resourceId}`
    const cached = cache.get(key)
    if (cached) return cached

    const ayahKey = `${surahId}:${ayahNumber}`
    const result = await fetchTranslation(ayahKey, resourceId)

    const entry: TranslationEntry = {
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

/**
 * Translation data loader for Sahih International English translation.
 * Lazy-loads the JSON asset and caches it in memory.
 *
 * JSON structure: keys are "surah:ayah", values are
 * { t: (string | { f: number })[], f: Record<string, string> }
 * where t items that are objects with `f` key are footnote markers (skipped for plain text).
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const translationAsset = require('@/assets/data/en-sahih-international.json')

type TranslationEntry = {
  t: (string | { f: number })[]
  f: Record<string, string>
}

type TranslationData = Record<string, TranslationEntry>

let cachedData: TranslationData | null = null

/**
 * Lazy-load and cache the translation JSON in memory.
 * Since we use require(), the data is bundled at build time,
 * but we still defer parsing to first access.
 */
export async function loadTranslations(): Promise<void> {
  if (cachedData) return
  cachedData = translationAsset as TranslationData
}

/**
 * Get plain-text translation for a given ayah, stripping footnote markers.
 * Returns empty string if translation not found.
 */
export function getTranslationText(surahId: number, ayahNumber: number): string {
  const data = cachedData ?? (translationAsset as TranslationData)
  if (!cachedData) cachedData = data

  const key = `${surahId}:${ayahNumber}`
  const entry = data[key]
  if (!entry) return ''

  return entry.t
    .filter((item): item is string => typeof item === 'string')
    .join('')
}

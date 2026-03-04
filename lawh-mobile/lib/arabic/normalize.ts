// Arabic normalization pipeline for comparison operations.
// NEVER use this for display — always preserve full tashkeel in UI.
// Order matters: strip tashkeel first, then normalize character variants.

// Tashkeel (diacritics) range + tatweel
const TASHKEEL_RANGE = /[\u0610-\u061A\u064B-\u065F\u0670]/g
const TATWEEL = /\u0640/g  // Kashida/elongation mark

// Hamza and alef variants → canonical form
const HAMZA_SUBSTITUTIONS: [RegExp, string][] = [
  [/\u0622/g, '\u0627'],  // آ (alef with madda above) → ا
  [/\u0623/g, '\u0627'],  // أ (alef with hamza above) → ا
  [/\u0625/g, '\u0627'],  // إ (alef with hamza below) → ا
  [/\u0671/g, '\u0627'],  // ٱ (alef wasla) → ا
  [/\u0624/g, '\u0648'],  // ؤ (waw with hamza above) → و
  [/\u0626/g, '\u064A'],  // ئ (ya with hamza above) → ي
  [/\u0621/g, ''],        // ء (standalone hamza) → remove
]

const TA_MARBUTA  = /\u0629/g  // ة → ه
const ALEF_MAQSURA = /\u0649/g // ى → ي

export function normalizeArabic(text: string): string {
  if (!text) return ''
  let s = text
  s = s.replace(TASHKEEL_RANGE, '')
  s = s.replace(TATWEEL, '')
  for (const [pattern, replacement] of HAMZA_SUBSTITUTIONS) {
    s = s.replace(pattern, replacement)
  }
  s = s.replace(TA_MARBUTA, '\u0647')   // ة → ه
  s = s.replace(ALEF_MAQSURA, '\u064A') // ى → ي
  return s.normalize('NFC').trim()
}

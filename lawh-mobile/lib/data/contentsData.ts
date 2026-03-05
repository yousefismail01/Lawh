// Data layer for Contents screen — juz-grouped surahs and hizb/quarter sections

import { chapters } from '@/lib/data/mushafData'
import { getPageJuzHizb, JUZ_START_PAGES, HIZB_START_PAGES, RUB_START_PAGES } from '@/lib/data/pageJuzHizb'

// Static surah start pages (1-indexed by surah number)
// Extracted from QPC V4 mushafData by scanning for surah banner lines
const SURAH_START_PAGES: number[] = [
  /* placeholder index 0 */ 0,
  1, 2, 50, 77, 106, 128, 151, 177, 187, 208,
  221, 235, 249, 255, 262, 267, 282, 293, 305, 312,
  322, 332, 342, 350, 359, 367, 377, 385, 396, 404,
  411, 415, 418, 428, 434, 440, 446, 453, 458, 467,
  477, 483, 489, 496, 499, 502, 507, 511, 515, 518,
  520, 523, 526, 528, 531, 534, 537, 542, 545, 549,
  551, 553, 554, 556, 558, 560, 562, 564, 566, 568,
  570, 572, 574, 575, 577, 578, 580, 582, 583, 585,
  586, 587, 587, 589, 590, 591, 591, 592, 593, 594,
  595, 595, 596, 596, 597, 597, 598, 598, 599, 599,
  600, 600, 601, 601, 601, 602, 602, 602, 603, 603,
  603, 604, 604, 604,
]

export interface SurahInfo {
  id: number
  nameArabic: string
  nameSimple: string
  versesCount: number
  revelationPlace: string
  pageStart: number
}

export interface JuzSection {
  title: string
  juz: number
  data: SurahInfo[]
}

export function getSurahStartPage(surahId: number): number {
  return SURAH_START_PAGES[surahId] ?? 1
}

let _cachedJuzSections: JuzSection[] | null = null

export function buildJuzSections(): JuzSection[] {
  if (_cachedJuzSections) return _cachedJuzSections

  // Build surah page ranges: [startPage, endPage] for each surah
  const surahRanges: { surah: SurahInfo; startPage: number; endPage: number }[] = []
  for (let id = 1; id <= 114; id++) {
    const ch = chapters[id]
    if (!ch) continue
    const startPage = SURAH_START_PAGES[id]
    const endPage = id < 114 ? SURAH_START_PAGES[id + 1] - 1 : 604
    surahRanges.push({
      surah: {
        id,
        nameArabic: ch.nameArabic,
        nameSimple: ch.nameSimple,
        versesCount: ch.versesCount,
        revelationPlace: ch.revelationPlace,
        pageStart: startPage,
      },
      startPage,
      endPage,
    })
  }

  // For each juz, find all surahs that overlap its page range
  const sections: JuzSection[] = []
  for (let juz = 1; juz <= 30; juz++) {
    const juzStart = JUZ_START_PAGES[juz - 1]
    const juzEnd = juz < 30 ? JUZ_START_PAGES[juz] - 1 : 604

    const data: SurahInfo[] = []
    for (const { surah, startPage, endPage } of surahRanges) {
      if (startPage <= juzEnd && endPage >= juzStart) {
        data.push(surah)
      }
    }

    sections.push({ title: `PART ${juz}`, juz, data })
  }

  _cachedJuzSections = sections
  return sections
}

// Quarters tab data types
export interface QuarterEntry {
  quarterIndex: number // 0-3
  startPage: number
}

export interface HizbEntry {
  hizbNumber: number
  quarters: QuarterEntry[]
}

export interface JuzQuarterSection {
  juz: number
  hizbs: HizbEntry[]
}

let _cachedQuarterSections: JuzQuarterSection[] | null = null

export function buildQuarterSections(): JuzQuarterSection[] {
  if (_cachedQuarterSections) return _cachedQuarterSections

  const sections: JuzQuarterSection[] = []

  for (let juz = 1; juz <= 30; juz++) {
    const hizbIndex1 = (juz - 1) * 2 // 0-based index into HIZB_START_PAGES
    const hizbIndex2 = hizbIndex1 + 1

    const hizbs: HizbEntry[] = []

    for (const hizbIdx of [hizbIndex1, hizbIndex2]) {
      const hizbNumber = hizbIdx + 1
      const rubBaseIdx = hizbIdx * 4 // 0-based into RUB_START_PAGES

      const quarters: QuarterEntry[] = []
      for (let q = 0; q < 4; q++) {
        quarters.push({
          quarterIndex: q,
          startPage: RUB_START_PAGES[rubBaseIdx + q],
        })
      }

      hizbs.push({ hizbNumber, quarters })
    }

    sections.push({ juz, hizbs })
  }

  _cachedQuarterSections = sections
  return sections
}

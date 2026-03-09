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

export type SortOrder = 'ascending' | 'descending' | 'revelation'

export interface SurahInfo {
  id: number
  nameArabic: string
  nameSimple: string
  versesCount: number
  revelationPlace: string
  pageStart: number
}

// Standard revelation order of the 114 surahs
const REVELATION_ORDER: number[] = [
  96, 68, 73, 74, 1, 111, 81, 87, 92, 89,
  93, 94, 103, 100, 108, 102, 107, 109, 105, 113,
  114, 112, 53, 80, 97, 91, 85, 95, 106, 101,
  75, 104, 77, 50, 90, 86, 54, 38, 7, 72,
  36, 25, 35, 19, 20, 56, 26, 27, 28, 17,
  10, 11, 12, 15, 6, 37, 31, 34, 39, 40,
  41, 42, 43, 44, 45, 46, 51, 88, 18, 16,
  71, 14, 21, 23, 32, 52, 67, 69, 70, 78,
  79, 82, 84, 30, 29, 83, 2, 8, 3, 33,
  60, 4, 99, 57, 47, 13, 55, 76, 65, 98,
  59, 24, 22, 63, 58, 49, 66, 64, 61, 62,
  48, 5, 9, 110,
]

// Build a map: surahId -> revelation order position (1-indexed)
const _revelationRank: Record<number, number> = {}
for (let i = 0; i < REVELATION_ORDER.length; i++) {
  _revelationRank[REVELATION_ORDER[i]] = i + 1
}

export function getRevelationRank(surahId: number): number {
  return _revelationRank[surahId] ?? surahId
}

let _cachedAllSurahs: SurahInfo[] | null = null

export function buildAllSurahs(): SurahInfo[] {
  if (_cachedAllSurahs) return _cachedAllSurahs
  const result: SurahInfo[] = []
  for (let id = 1; id <= 114; id++) {
    const ch = chapters[id]
    if (!ch) continue
    result.push({
      id,
      nameArabic: ch.nameArabic,
      nameSimple: ch.nameSimple,
      versesCount: ch.versesCount,
      revelationPlace: ch.revelationPlace,
      pageStart: SURAH_START_PAGES[id],
    })
  }
  _cachedAllSurahs = result
  return result
}

export function sortSurahs(surahs: SurahInfo[], order: SortOrder): SurahInfo[] {
  const copy = [...surahs]
  switch (order) {
    case 'ascending':
      return copy.sort((a, b) => a.id - b.id)
    case 'descending':
      return copy.sort((a, b) => b.id - a.id)
    case 'revelation':
      return copy.sort((a, b) => getRevelationRank(a.id) - getRevelationRank(b.id))
  }
}

export interface JuzSection {
  title: string
  juz: number
  data: SurahInfo[]
}

export function getSurahStartPage(surahId: number): number {
  return SURAH_START_PAGES[surahId] ?? 1
}

/** Get the surah that contains a given mushaf page */
export function getSurahForPage(page: number): { id: number; nameSimple: string } {
  // Binary-search-style: find the last surah whose start page <= page
  let surahId = 1
  for (let i = 114; i >= 1; i--) {
    if (SURAH_START_PAGES[i] <= page) {
      surahId = i
      break
    }
  }
  const ch = chapters[surahId]
  return { id: surahId, nameSimple: ch?.nameSimple ?? `Surah ${surahId}` }
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
        // If surah starts before this juz, navigate to the juz start page instead
        const navPage = startPage < juzStart ? juzStart : startPage
        data.push({ ...surah, pageStart: navPage })
      }
    }

    sections.push({ title: `PART ${juz}`, juz, data })
  }

  _cachedJuzSections = sections
  return sections
}

// Chapter sections grouped by juz (for Chapters tab — always uses surah's actual start page)
let _cachedChapterSections: Record<SortOrder, JuzSection[]> = {} as Record<SortOrder, JuzSection[]>

export function buildChapterSections(order: SortOrder): JuzSection[] {
  if (_cachedChapterSections[order]) return _cachedChapterSections[order]

  const allSurahs = buildAllSurahs()

  // Group surahs by which juz their start page falls in
  const juzMap = new Map<number, SurahInfo[]>()
  for (let juz = 1; juz <= 30; juz++) juzMap.set(juz, [])

  for (const surah of allSurahs) {
    const { juz } = getPageJuzHizb(surah.pageStart)
    juzMap.get(juz)!.push(surah)
  }

  const sections: JuzSection[] = []
  for (let juz = 1; juz <= 30; juz++) {
    const surahs = juzMap.get(juz)!
    if (surahs.length === 0) continue
    const sorted = sortSurahs(surahs, order)
    sections.push({ title: `JUZ ${juz}`, juz, data: sorted })
  }

  _cachedChapterSections[order] = sections
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

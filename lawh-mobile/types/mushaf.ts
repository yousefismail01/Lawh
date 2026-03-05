export interface Word {
  id: number
  surahId: number
  ayahNumber: number
  riwayah: string
  position: number        // word position within ayah
  pageNumber: number      // 1-604
  lineNumber: number      // 1-15
  textUthmani: string     // Arabic word text with tashkeel
  codeV4: string | null   // V4 glyph code for per-page tajweed font
  charType: string        // 'word' | 'end' (verse end marker)
}

export interface MushafPageData {
  pageNumber: number
  lines: Word[][]         // grouped by lineNumber (1-15), each inner array is words for that line
  surahs: { id: number; nameArabic: string }[]  // surahs that appear on this page
  juz: number
}

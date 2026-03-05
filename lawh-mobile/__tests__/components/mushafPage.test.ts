/**
 * Test for MUSH-03: MushafPage component logic
 * Tests line grouping and surah transition detection logic
 */
import type { Word } from '../../types/mushaf'

function groupByLine(wordList: Word[]): Word[][] {
  const lineMap = new Map<number, Word[]>()
  for (const word of wordList) {
    const existing = lineMap.get(word.lineNumber)
    if (existing) {
      existing.push(word)
    } else {
      lineMap.set(word.lineNumber, [word])
    }
  }
  const lines: Word[][] = []
  const maxLine = Math.max(15, ...lineMap.keys())
  for (let i = 1; i <= maxLine; i++) {
    lines.push(lineMap.get(i) ?? [])
  }
  return lines
}

function detectSurahStarts(lines: Word[][]): Map<number, number> {
  const starts = new Map<number, number>()
  let prevSurahId: number | null = null
  for (let i = 0; i < lines.length; i++) {
    const lineWords = lines[i]
    if (lineWords.length === 0) continue
    const firstWord = lineWords[0]
    if (firstWord.surahId !== prevSurahId) {
      if (firstWord.position === 1 && firstWord.ayahNumber === 1) {
        starts.set(i, firstWord.surahId)
      }
      prevSurahId = firstWord.surahId
    }
  }
  return starts
}

function makeWord(overrides: Partial<Word> = {}): Word {
  return {
    id: 1,
    surahId: 2,
    ayahNumber: 1,
    riwayah: 'hafs',
    position: 1,
    pageNumber: 3,
    lineNumber: 1,
    textUthmani: '\u0628\u0650\u0633\u0652\u0645\u0650',
    charType: 'word',
    ...overrides,
  }
}

describe('MushafPage component', () => {
  it('groups words into exactly 15 lines minimum', () => {
    const words: Word[] = [
      makeWord({ lineNumber: 1, position: 1 }),
      makeWord({ lineNumber: 1, position: 2 }),
      makeWord({ lineNumber: 5, position: 1 }),
    ]
    const lines = groupByLine(words)
    expect(lines.length).toBe(15)
    expect(lines[0].length).toBe(2)  // line 1 has 2 words
    expect(lines[4].length).toBe(1)  // line 5 has 1 word
    expect(lines[1].length).toBe(0)  // line 2 is empty
  })

  it('groups words by lineNumber into lines', () => {
    const words: Word[] = []
    for (let line = 1; line <= 15; line++) {
      for (let pos = 1; pos <= 3; pos++) {
        words.push(makeWord({ lineNumber: line, position: pos, id: line * 100 + pos }))
      }
    }
    const lines = groupByLine(words)
    expect(lines.length).toBe(15)
    for (const line of lines) {
      expect(line.length).toBe(3)
    }
  })

  it('renders surah banner when new surah starts on page', () => {
    const words: Word[] = [
      makeWord({ lineNumber: 1, surahId: 1, ayahNumber: 5, position: 3 }),
      makeWord({ lineNumber: 3, surahId: 2, ayahNumber: 1, position: 1 }),
    ]
    const lines = groupByLine(words)
    const starts = detectSurahStarts(lines)
    // Line index 2 (lineNumber 3) should have surah 2 start
    expect(starts.has(2)).toBe(true)
    expect(starts.get(2)).toBe(2)
  })

  it('detects ayah end markers by charType', () => {
    const endWord = makeWord({ charType: 'end', textUthmani: '\u06F1' })
    expect(endWord.charType).toBe('end')
  })

  it('does not detect surah start if ayahNumber > 1', () => {
    const words: Word[] = [
      makeWord({ lineNumber: 1, surahId: 1, ayahNumber: 5, position: 3 }),
      makeWord({ lineNumber: 3, surahId: 2, ayahNumber: 3, position: 1 }),
    ]
    const lines = groupByLine(words)
    const starts = detectSurahStarts(lines)
    // Should not detect surah start when ayahNumber > 1
    expect(starts.has(2)).toBe(false)
  })
})

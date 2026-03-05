import { useState, useEffect, useCallback } from 'react'
import { quranService } from '@/services/quranService'
import type { Word, MushafPageData } from '@/types/mushaf'
import type { Riwayah } from '@/types/riwayah'

interface UseMushafPageResult {
  lines: Word[][]
  metadata: { pageNumber: number; surahs: { id: number; nameArabic: string }[]; juz: number } | null
  loading: boolean
  error: string | null
}

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

  // Return lines in order 1-15, filling empty lines with empty arrays
  const lines: Word[][] = []
  const maxLine = Math.max(15, ...lineMap.keys())
  for (let i = 1; i <= maxLine; i++) {
    lines.push(lineMap.get(i) ?? [])
  }
  return lines
}

export function useMushafPage(pageNumber: number, riwayah?: Riwayah): UseMushafPageResult {
  const [lines, setLines] = useState<Word[][]>([])
  const [metadata, setMetadata] = useState<UseMushafPageResult['metadata']>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPage = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [wordList, meta] = await Promise.all([
        quranService.getWordsByPage(pageNumber, riwayah),
        quranService.getPageMetadata(pageNumber, riwayah),
      ])
      setLines(groupByLine(wordList as Word[]))
      setMetadata(meta)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load page')
    } finally {
      setLoading(false)
    }
  }, [pageNumber, riwayah])

  useEffect(() => {
    fetchPage()
  }, [fetchPage])

  return { lines, metadata, loading, error }
}

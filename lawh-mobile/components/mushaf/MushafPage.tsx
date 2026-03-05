import React from 'react'
import { View, Text, StyleSheet, ActivityIndicator, useColorScheme } from 'react-native'
import { useMushafPage } from '@/hooks/useMushafPage'
import { MushafFrame } from './MushafFrame'
import { MushafPageHeader } from './MushafPageHeader'
import { MushafLine } from './MushafLine'
import { MushafSurahBanner } from './MushafSurahBanner'
import { MushafBismillah } from './MushafBismillah'
import type { Word } from '@/types/mushaf'

interface MushafPageProps {
  pageNumber: number
  onAyahLongPress?: (info: { surahId: number; ayahNumber: number }) => void
}

/**
 * Detect surah transitions within a page's line data.
 * Returns a map of lineNumber -> surahId for lines where a new surah starts.
 */
function detectSurahStarts(lines: Word[][]): Map<number, { surahId: number; surahName: string }> {
  const starts = new Map<number, { surahId: number; surahName: string }>()
  let prevSurahId: number | null = null

  for (let i = 0; i < lines.length; i++) {
    const lineWords = lines[i]
    if (lineWords.length === 0) continue

    const firstWord = lineWords[0]
    if (firstWord.surahId !== prevSurahId) {
      // New surah detected - check if first word is position 1 and ayah 1
      if (firstWord.position === 1 && firstWord.ayahNumber === 1) {
        starts.set(i, { surahId: firstWord.surahId, surahName: '' })
      }
      prevSurahId = firstWord.surahId
    }
  }

  return starts
}

const MushafPageInner = function MushafPageInner({ pageNumber, onAyahLongPress }: MushafPageProps) {
  const { lines, metadata, loading, error } = useMushafPage(pageNumber)
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const isSpecialPage = pageNumber === 1 || pageNumber === 2

  if (loading) {
    return (
      <MushafFrame isSpecialPage={isSpecialPage}>
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={isDark ? '#8a7340' : '#c9a84c'} />
        </View>
      </MushafFrame>
    )
  }

  if (error || !metadata) {
    return (
      <MushafFrame isSpecialPage={isSpecialPage}>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: isDark ? '#a09880' : '#8a7a60' }]}>
            {error ?? 'Failed to load page'}
          </Text>
        </View>
      </MushafFrame>
    )
  }

  const surahStarts = detectSurahStarts(lines)
  // Enrich surah starts with names from metadata
  for (const [lineIdx, info] of surahStarts) {
    const surahMeta = metadata.surahs.find(s => s.id === info.surahId)
    if (surahMeta) {
      info.surahName = surahMeta.nameArabic
    }
  }

  const primarySurah = metadata.surahs[0]

  // Build rendered lines: some lines become banners or bismillah
  const renderedLines: React.ReactNode[] = []
  let lineIndex = 0

  for (let i = 0; i < lines.length; i++) {
    const surahStart = surahStarts.get(i)

    if (surahStart) {
      // Render surah banner
      renderedLines.push(
        <MushafSurahBanner
          key={`banner-${surahStart.surahId}`}
          surahName={surahStart.surahName}
        />
      )

      // Render bismillah (if applicable) on the next conceptual slot
      if (surahStart.surahId !== 1 && surahStart.surahId !== 9) {
        renderedLines.push(
          <MushafBismillah key={`bismillah-${surahStart.surahId}`} surahId={surahStart.surahId} />
        )
      }

      // Render the actual text line
      renderedLines.push(
        <MushafLine
          key={`line-${i}`}
          words={lines[i]}
          isCentered={isSpecialPage}
          onAyahLongPress={onAyahLongPress}
        />
      )
    } else {
      renderedLines.push(
        <MushafLine
          key={`line-${i}`}
          words={lines[i]}
          isCentered={isSpecialPage}
          onAyahLongPress={onAyahLongPress}
        />
      )
    }

    lineIndex++
  }

  return (
    <MushafFrame isSpecialPage={isSpecialPage}>
      <MushafPageHeader
        surahName={primarySurah?.nameArabic ?? ''}
        juz={metadata.juz}
        pageNumber={pageNumber}
      />
      <View style={[styles.linesContainer, isSpecialPage && styles.specialLinesContainer]}>
        {renderedLines}
      </View>
    </MushafFrame>
  )
}

export const MushafPage = React.memo(MushafPageInner)

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'KFGQPCHafs',
  },
  linesContainer: {
    flex: 1,
  },
  specialLinesContainer: {
    justifyContent: 'center',
    paddingVertical: 20,
  },
})

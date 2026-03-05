import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MushafFrame } from './MushafFrame'
import { MushafPageHeader } from './MushafPageHeader'
import { MushafSurahBanner } from './MushafSurahBanner'
import { MushafBismillah } from './MushafBismillah'
import { useV4Font } from '@/hooks/useV4Font'
import { getPageLines, chapters } from '@/lib/data/mushafData'
import { getPageJuzHizb } from '@/lib/data/pageJuzHizb'
import { quranService } from '@/services/quranService'

// Gap between safe area and header — sized so chrome header never covers any content.
// Chrome header = safeArea + ~52px. MushafPageHeader = ~32px.
// Total reserved top = safeArea + TOP_GAP + 32. Must exceed safeArea + 52.
// Extra 10px breathing room so first line (surah banner) has clearance.
const TOP_GAP = 32
// Footer height — sized so chrome footer (PageNavigator ~60px) never covers verses
const BOTTOM_BUFFER = 64

interface MushafPageProps {
  pageNumber: number
  onAyahLongPress?: (info: { surahId: number; ayahNumber: number }) => void
  onPress?: () => void
  /** When set, overrides the V4 COLRv1 font colors with a uniform text color (tajweed off). */
  tajweedColorOverride?: string
}

/** Find the primary surah for a page by checking surah page ranges */
function getSurahForPage(page: number): { id: number; nameArabic: string; nameSimple: string } | null {
  const lines = getPageLines(page)
  let lastSurahId: number | null = null
  for (const line of lines) {
    if (line.type === 'surah') lastSurahId = line.surahId
  }
  if (lastSurahId) {
    const ch = chapters[lastSurahId]
    return ch ? { id: lastSurahId, nameArabic: ch.nameArabic, nameSimple: ch.nameSimple } : null
  }
  for (let p = page - 1; p >= 1; p--) {
    const pLines = getPageLines(p)
    for (let i = pLines.length - 1; i >= 0; i--) {
      const pLine = pLines[i]
      if (pLine.type === 'surah') {
        const sid = pLine.surahId
        const ch = chapters[sid]
        return ch ? { id: sid, nameArabic: ch.nameArabic, nameSimple: ch.nameSimple } : null
      }
    }
  }
  return { id: 1, nameArabic: chapters[1].nameArabic, nameSimple: chapters[1].nameSimple }
}

export { getSurahForPage, getPageJuzHizb }

const MushafPageInner = function MushafPageInner({ pageNumber, onAyahLongPress, onPress, tajweedColorOverride }: MushafPageProps) {
  const insets = useSafeAreaInsets()
  const { fontName, isLoaded: v4Loaded } = useV4Font(pageNumber)
  const pageLines = getPageLines(pageNumber)

  // Map line numbers (1-indexed from DB) to ayah info for long-press
  const [lineAyahMap, setLineAyahMap] = useState<Map<number, { surahId: number; ayahNumber: number }>>(new Map())
  useEffect(() => {
    let cancelled = false
    quranService.getLineAyahMap(pageNumber).then((map) => {
      if (!cancelled) setLineAyahMap(map)
    })
    return () => { cancelled = true }
  }, [pageNumber])

  if (!v4Loaded) {
    return (
      <MushafFrame>
        <View style={styles.centered}>
          <ActivityIndicator size="small" color="#999" />
        </View>
      </MushafFrame>
    )
  }

  const primarySurah = getSurahForPage(pageNumber)
  const { juz } = getPageJuzHizb(pageNumber)
  const renderedLines: React.ReactNode[] = []

  for (let i = 0; i < 15; i++) {
    const line = pageLines[i]

    if (line.type === 'surah') {
      const ch = chapters[line.surahId]
      renderedLines.push(
        <View key={`line-${i}`} style={styles.lineSlot}>
          <MushafSurahBanner
            surahName={ch?.nameArabic ?? ''}
            surahId={line.surahId}
          />
        </View>
      )
    } else if (line.type === 'basmallah') {
      renderedLines.push(
        <View key={`line-${i}`} style={styles.lineSlot}>
          <MushafBismillah surahId={0} />
        </View>
      )
    } else if (line.type === 'ayah') {
      const lineText = [...line.text].join(' ')
      renderedLines.push(
        <View key={`line-${i}`} style={styles.lineSlot}>
          <Pressable
            style={styles.v4LineContainer}
            onPress={onPress}
            onLongPress={onAyahLongPress ? () => {
              const lineInfo = lineAyahMap.get(i + 1)
              onAyahLongPress({
                surahId: lineInfo?.surahId ?? primarySurah?.id ?? 1,
                ayahNumber: lineInfo?.ayahNumber ?? 1,
              })
            } : undefined}
          >
            <Text
              style={[
                styles.v4Line,
                {
                  fontFamily: fontName,
                  textAlign: line.centered ? 'center' : 'justify',
                  color: tajweedColorOverride ?? styles.v4Line.color,
                },
              ]}
            >
              {lineText}
            </Text>
          </Pressable>
        </View>
      )
    } else {
      renderedLines.push(
        <View key={`line-${i}`} style={styles.lineSlot} />
      )
    }
  }

  return (
    <MushafFrame>
      <Pressable style={styles.content} onPress={onPress}>
        {/* Top: safe area + gap + always-visible surah header */}
        <View style={{ height: insets.top + TOP_GAP }}>
          {/* spacer for safe area + gap — chrome header overlays this zone */}
        </View>
        <MushafPageHeader
          surahNameSimple={primarySurah?.nameSimple ?? ''}
          juz={juz}
          pageNumber={pageNumber}
        />

        {/* Quran lines */}
        <View style={styles.linesContainer}>
          {renderedLines}
        </View>

        {/* Bottom buffer — chrome footer overlays this zone */}
        <View style={styles.bottomBuffer}>
          <Text style={styles.pageNum}>{pageNumber}</Text>
        </View>
      </Pressable>
    </MushafFrame>
  )
}

export const MushafPage = React.memo(MushafPageInner)

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  linesContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  lineSlot: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'visible',
  },
  v4LineContainer: {
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  v4Line: {
    fontSize: 22,
    color: '#000',
    writingDirection: 'rtl',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  bottomBuffer: {
    height: BOTTOM_BUFFER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNum: {
    fontSize: 12,
    color: '#999',
  },
})

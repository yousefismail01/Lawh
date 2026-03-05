import React from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native'
import { MushafFrame } from './MushafFrame'
import { MushafPageHeader } from './MushafPageHeader'
import { MushafSurahBanner } from './MushafSurahBanner'
import { MushafBismillah } from './MushafBismillah'
import { useV4Font } from '@/hooks/useV4Font'
import { getPageLines, chapters } from '@/lib/data/mushafData'

const HEADER_HEIGHT = 30
const FOOTER_HEIGHT = 28
const LINES_PADDING_TOP = 20
const LINES_PADDING_BOTTOM = 8

interface MushafPageProps {
  pageNumber: number
  onAyahLongPress?: (info: { surahId: number; ayahNumber: number }) => void
}

/** Find the primary surah for a page by checking surah page ranges */
function getSurahForPage(page: number): { id: number; nameArabic: string } | null {
  for (let i = 114; i >= 1; i--) {
    // chapters doesn't have pageStart, so find the first surah line on or before this page
    // Simple heuristic: iterate backwards
  }
  // Check which surahs appear on this page from the layout lines
  const lines = getPageLines(page)
  let lastSurahId: number | null = null
  for (const line of lines) {
    if (line.type === 'surah') lastSurahId = line.surahId
  }
  // If no surah_name line on this page, check previous pages
  if (lastSurahId) {
    const ch = chapters[lastSurahId]
    return ch ? { id: lastSurahId, nameArabic: ch.nameArabic } : null
  }
  // Walk backwards to find the current surah
  for (let p = page - 1; p >= 1; p--) {
    const pLines = getPageLines(p)
    for (let i = pLines.length - 1; i >= 0; i--) {
      const pLine = pLines[i]
      if (pLine.type === 'surah') {
        const sid = pLine.surahId
        const ch = chapters[sid]
        return ch ? { id: sid, nameArabic: ch.nameArabic } : null
      }
    }
  }
  return { id: 1, nameArabic: chapters[1].nameArabic }
}

const MushafPageInner = function MushafPageInner({ pageNumber, onAyahLongPress }: MushafPageProps) {
  const { fontName, isLoaded: v4Loaded } = useV4Font(pageNumber)
  const pageLines = getPageLines(pageNumber)

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
      // Matches QUL sample: getWords(first, last).join(' ')
      const lineText = [...line.text].join(' ')
      renderedLines.push(
        <View key={`line-${i}`} style={[styles.lineSlot, line.centered && styles.lineCentered]}>
          <Pressable
            style={[styles.v4LineContainer, line.centered && styles.lineCentered]}
            onLongPress={onAyahLongPress ? () => onAyahLongPress({ surahId: primarySurah?.id ?? 1, ayahNumber: 1 }) : undefined}
          >
            <Text style={[styles.v4Line, { fontFamily: fontName }]}>
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
      <View style={styles.content}>
        <View style={{ height: HEADER_HEIGHT }}>
          <MushafPageHeader
            surahName={primarySurah?.nameArabic ?? ''}
            surahId={primarySurah?.id}
            juz={1}
            pageNumber={pageNumber}
          />
        </View>
        <View style={styles.linesContainer}>
          {renderedLines}
        </View>
        <View style={[styles.footer, { height: FOOTER_HEIGHT }]}>
          <Text style={styles.footerText}>{pageNumber}</Text>
        </View>
      </View>
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
    paddingTop: LINES_PADDING_TOP,
    paddingBottom: LINES_PADDING_BOTTOM,
    paddingHorizontal: 12,
  },
  lineSlot: {
    flex: 1,
    overflow: 'visible',
  },
  lineCentered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  v4LineContainer: {
    flex: 1,
  },
  v4Line: {
    fontSize: 22,
    color: '#000',
    writingDirection: 'rtl',
    textAlign: 'right',
    includeFontPadding: false,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
})

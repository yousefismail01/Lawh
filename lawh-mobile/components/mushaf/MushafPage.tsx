import React from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native'
import { MushafFrame } from './MushafFrame'
import { MushafPageHeader } from './MushafPageHeader'
import { MushafSurahBanner } from './MushafSurahBanner'
import { MushafBismillah } from './MushafBismillah'
import { useV4Font } from '@/hooks/useV4Font'
import { getPageLines, chapters } from '@/lib/data/mushafData'
import { getPageJuzHizb } from '@/lib/data/pageJuzHizb'

const HEADER_HEIGHT = 30
const FOOTER_HEIGHT = 28

interface MushafPageProps {
  pageNumber: number
  onAyahLongPress?: (info: { surahId: number; ayahNumber: number }) => void
  onPress?: () => void
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

const MushafPageInner = function MushafPageInner({ pageNumber, onAyahLongPress, onPress }: MushafPageProps) {
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
  const { juz, hizb, quarter } = getPageJuzHizb(pageNumber)
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
      // Per the spec: retrieve words and join them to form a single string
      const lineText = [...line.text].join(' ')
      renderedLines.push(
        <View key={`line-${i}`} style={styles.lineSlot}>
          <Pressable
            style={styles.v4LineContainer}
            onPress={onPress}
            onLongPress={onAyahLongPress ? () => onAyahLongPress({ surahId: primarySurah?.id ?? 1, ayahNumber: 1 }) : undefined}
          >
            <Text
              style={[
                styles.v4Line,
                {
                  fontFamily: fontName,
                  textAlign: line.centered ? 'center' : 'justify',
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
        <View style={{ height: HEADER_HEIGHT }}>
          <MushafPageHeader
            surahNameSimple={primarySurah?.nameSimple ?? ''}
            juz={juz}
            hizb={hizb}
            quarter={quarter}
            pageNumber={pageNumber}
          />
        </View>
        <View style={styles.linesContainer}>
          {renderedLines}
        </View>
        <View style={[styles.footer, { height: FOOTER_HEIGHT }]}>
          <Text style={styles.footerText}>{pageNumber}</Text>
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

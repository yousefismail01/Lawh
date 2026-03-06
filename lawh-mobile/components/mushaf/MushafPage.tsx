import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Pressable, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MushafFrame } from './MushafFrame'
import { MushafPageHeader } from './MushafPageHeader'
import { MushafSurahBanner } from './MushafSurahBanner'
import { MushafBismillah } from './MushafBismillah'
import { useV4Font } from '@/hooks/useV4Font'
import { getV4FontName } from '@/lib/fonts/qpcV4FontManager'
import { getPageLines, chapters } from '@/lib/data/mushafData'
import { getPageJuzHizb } from '@/lib/data/pageJuzHizb'
import { quranService } from '@/services/quranService'
import { useSettingsStore } from '@/stores/settingsStore'

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
  tajweedEnabled?: boolean
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

/** Split a line's characters into segments: regular words vs end-of-ayah markers */
function splitLineByMarkers(chars: string[], markerGlyphs: Set<string>): { text: string; isMarker: boolean }[] {
  const segments: { text: string; isMarker: boolean }[] = []
  let currentChars: string[] = []
  let currentIsMarker = false

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    const isMarker = markerGlyphs.has(ch)

    if (i === 0) {
      currentIsMarker = isMarker
      currentChars.push(ch)
    } else if (isMarker === currentIsMarker) {
      currentChars.push(ch)
    } else {
      segments.push({ text: currentChars.join(' '), isMarker: currentIsMarker })
      currentChars = [ch]
      currentIsMarker = isMarker
    }
  }

  if (currentChars.length > 0) {
    segments.push({ text: currentChars.join(' '), isMarker: currentIsMarker })
  }

  return segments
}

const MushafPageInner = function MushafPageInner({ pageNumber, onAyahLongPress, onPress, tajweedEnabled = true }: MushafPageProps) {
  const insets = useSafeAreaInsets()
  const { fontName: plainFontName, isLoaded: plainLoaded } = useV4Font(pageNumber, false)
  const { fontName: tajweedFontName, isLoaded: tajweedLoaded } = useV4Font(pageNumber, true)
  const pageLines = getPageLines(pageNumber)

  // Theme resolution
  const appThemeMode = useSettingsStore((s) => s.appThemeMode)
  const lightVariant = useSettingsStore((s) => s.lightVariant)
  const darkVariant = useSettingsStore((s) => s.darkVariant)
  const systemScheme = useColorScheme()
  const isDark = appThemeMode === 'auto' ? systemScheme === 'dark' : appThemeMode === 'dark'
  const bgColor = isDark ? (darkVariant === 'black' ? '#000000' : '#1C1C1E') : (lightVariant === 'white' ? '#FFFFFF' : '#FAF6F0')
  const txtColor = isDark ? '#FFFFFF' : '#000000'
  const secColor = isDark ? '#999999' : '#666666'
  const sepColor = isDark ? '#333333' : '#e0e0e0'

  const fontName = tajweedEnabled ? tajweedFontName : plainFontName
  const v4Loaded = tajweedEnabled ? tajweedLoaded : (plainLoaded && tajweedLoaded)

  // Map line numbers (1-indexed from DB) to ayah info for long-press
  const [lineAyahMap, setLineAyahMap] = useState<Map<number, { surahId: number; ayahNumber: number }>>(new Map())
  const [markerGlyphs, setMarkerGlyphs] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    quranService.getLineAyahMap(pageNumber).then((map) => {
      if (!cancelled) setLineAyahMap(map)
    })
    quranService.getPageEndMarkerGlyphs(pageNumber).then((set) => {
      if (!cancelled) setMarkerGlyphs(set)
    })
    return () => { cancelled = true }
  }, [pageNumber])

  if (!v4Loaded) {
    return (
      <MushafFrame backgroundColor={bgColor}>
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={secColor} />
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
      const chars = [...line.text]
      const needsSplit = !tajweedEnabled && markerGlyphs.size > 0

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
                  // Sets COLRv1 foreground color ref — base text becomes white in dark mode
                  // while tajweed color layers are preserved.
                  color: txtColor,
                },
              ]}
            >
              {needsSplit ? (
                splitLineByMarkers(chars, markerGlyphs).map((seg, si) => (
                  seg.isMarker ? (
                    <Text key={si} style={{ fontFamily: tajweedFontName }}>
                      {si > 0 ? ' ' : ''}{seg.text}
                    </Text>
                  ) : (
                    <React.Fragment key={si}>
                      {si > 0 ? ' ' : ''}{seg.text}
                    </React.Fragment>
                  )
                ))
              ) : (
                chars.join(' ')
              )}
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
    <MushafFrame backgroundColor={bgColor}>
      <Pressable style={styles.content} onPress={onPress}>
        {/* Top: safe area + gap + always-visible surah header */}
        <View style={{ height: insets.top + TOP_GAP }}>
          {/* spacer for safe area + gap — chrome header overlays this zone */}
        </View>
        <MushafPageHeader
          surahNameSimple={primarySurah?.nameSimple ?? ''}
          juz={juz}
          textColor={secColor}
          separatorColor={sepColor}
        />

        {/* Quran lines */}
        <View style={styles.linesContainer}>
          {renderedLines}
        </View>

        {/* Bottom buffer — chrome footer overlays this zone */}
        <View style={styles.bottomBuffer}>
          <Text style={[styles.pageNum, { color: secColor }]}>{pageNumber}</Text>
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

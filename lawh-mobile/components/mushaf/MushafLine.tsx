import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native'
import { AyahMarker } from './AyahMarker'
import type { Word } from '@/types/mushaf'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PAGE_PADDING = 0
const CONTENT_WIDTH = SCREEN_WIDTH - PAGE_PADDING * 2

export const MUSHAF_FONT_SIZE = Math.min(28, CONTENT_WIDTH / 14)
export const LINE_HEIGHT_RATIO = 2.2
const V4_FONT_SIZE = 30
const HIGHLIGHT_COLOR = '#c9a84c20'

interface MushafLineProps {
  words: Word[]
  isCentered?: boolean
  fontFamily?: string
  onAyahLongPress?: (info: { surahId: number; ayahNumber: number }) => void
}

/** Group consecutive words by ayahNumber (surahId + ayahNumber) */
function groupWordsByAyah(words: Word[]): { key: string; surahId: number; ayahNumber: number; words: Word[] }[] {
  const groups: { key: string; surahId: number; ayahNumber: number; words: Word[] }[] = []
  let current: { ayahKey: string; surahId: number; ayahNumber: number; words: Word[] } | null = null

  for (const word of words) {
    const ayahKey = `${word.surahId}-${word.ayahNumber}`
    if (!current || current.ayahKey !== ayahKey) {
      const firstPos = word.position
      const groupWords: Word[] = []
      current = { ayahKey, surahId: word.surahId, ayahNumber: word.ayahNumber, words: groupWords }
      groups.push({ key: `${ayahKey}-${firstPos}`, surahId: word.surahId, ayahNumber: word.ayahNumber, words: groupWords })
    }
    current.words.push(word)
  }

  return groups
}

export const MushafLine = React.memo(function MushafLine({
  words,
  isCentered = false,
  fontFamily,
  onAyahLongPress,
}: MushafLineProps) {
  const [highlightedAyah, setHighlightedAyah] = useState<string | null>(null)
  const useV4 = fontFamily && fontFamily !== 'KFGQPCHafs'

  const ayahGroups = useMemo(() => groupWordsByAyah(words), [words])

  const handleLongPress = useCallback(
    (surahId: number, ayahNumber: number) => {
      const key = `${surahId}-${ayahNumber}`
      setHighlightedAyah(key)
      setTimeout(() => setHighlightedAyah(null), 400)
      onAyahLongPress?.({ surahId, ayahNumber })
    },
    [onAyahLongPress]
  )

  if (words.length === 0) {
    return <View style={styles.emptyLine} />
  }

  // V4 mode: single Text per line, font auto-scales to fill width
  if (useV4) {
    // Concatenate all glyph codes without spaces — the font handles glyph spacing
    const lineText = words
      .map((w) => w.codeV4 ?? '')
      .join('')

    if (!lineText) {
      return <View style={styles.emptyLine} />
    }

    const firstWord = words[0]

    const textEl = (
      <Text
        style={[styles.v4Line, { fontFamily }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.01}
      >
        {lineText}
      </Text>
    )

    if (onAyahLongPress) {
      return (
        <Pressable
          style={styles.v4LineContainer}
          onLongPress={() => handleLongPress(firstWord.surahId, firstWord.ayahNumber)}
        >
          {textEl}
        </Pressable>
      )
    }

    return (
      <View style={styles.v4LineContainer}>
        {textEl}
      </View>
    )
  }

  // Legacy mode: individual word elements with flexbox
  return (
    <View
      style={[
        styles.line,
        isCentered ? styles.centered : styles.justified,
      ]}
    >
      {ayahGroups.map((group) => {
        const isHighlighted = highlightedAyah === group.key

        const content = group.words.map((word) => {
          if (word.charType === 'end') {
            return (
              <AyahMarker
                key={`${word.surahId}-${word.ayahNumber}-end`}
                number={word.ayahNumber}
              />
            )
          }
          return (
            <Text
              key={`${word.surahId}-${word.ayahNumber}-${word.position}`}
              style={[styles.word, { fontFamily: 'KFGQPCHafs' }]}
            >
              {word.textUthmani}
            </Text>
          )
        })

        if (onAyahLongPress) {
          return (
            <Pressable
              key={group.key}
              onLongPress={() => handleLongPress(group.surahId, group.ayahNumber)}
              style={[
                styles.ayahGroup,
                isHighlighted && styles.highlighted,
              ]}
            >
              {content}
            </Pressable>
          )
        }

        return (
          <View key={group.key} style={styles.ayahGroup}>
            {content}
          </View>
        )
      })}
    </View>
  )
})

const styles = StyleSheet.create({
  line: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 0,
  },
  justified: {
    justifyContent: 'space-between',
  },
  centered: {
    justifyContent: 'center',
    gap: 6,
  },
  emptyLine: {
    flex: 1,
  },
  v4LineContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  v4Line: {
    fontSize: 200,
    color: '#000',
    textAlign: 'center',
    includeFontPadding: false,
  },
  word: {
    fontSize: MUSHAF_FONT_SIZE,
    color: '#333',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  ayahGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: 4,
  },
  highlighted: {
    backgroundColor: HIGHLIGHT_COLOR,
  },
})

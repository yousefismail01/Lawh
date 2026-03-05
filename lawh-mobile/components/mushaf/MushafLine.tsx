import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, StyleSheet, useColorScheme, Pressable } from 'react-native'
import { AyahMarker } from './AyahMarker'
import type { Word } from '@/types/mushaf'

const MUSHAF_FONT_SIZE = 20
const LINE_HEIGHT = MUSHAF_FONT_SIZE * 2
const HIGHLIGHT_COLOR = '#c9a84c20'

interface MushafLineProps {
  words: Word[]
  isCentered?: boolean
  onAyahLongPress?: (info: { surahId: number; ayahNumber: number }) => void
}

/** Group consecutive words by ayahNumber (surahId + ayahNumber) */
function groupWordsByAyah(words: Word[]): { key: string; surahId: number; ayahNumber: number; words: Word[] }[] {
  const groups: { key: string; surahId: number; ayahNumber: number; words: Word[] }[] = []
  let current: typeof groups[0] | null = null

  for (const word of words) {
    const key = `${word.surahId}-${word.ayahNumber}`
    if (!current || current.key !== key) {
      current = { key, surahId: word.surahId, ayahNumber: word.ayahNumber, words: [] }
      groups.push(current)
    }
    current.words.push(word)
  }

  return groups
}

export const MushafLine = React.memo(function MushafLine({
  words,
  isCentered = false,
  onAyahLongPress,
}: MushafLineProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const textColor = isDark ? '#e8e0d0' : '#1a1a1a'
  const [highlightedAyah, setHighlightedAyah] = useState<string | null>(null)

  const ayahGroups = useMemo(() => groupWordsByAyah(words), [words])

  const handleLongPress = useCallback(
    (surahId: number, ayahNumber: number) => {
      const key = `${surahId}-${ayahNumber}`
      setHighlightedAyah(key)
      // Clear highlight after a brief moment
      setTimeout(() => setHighlightedAyah(null), 400)
      onAyahLongPress?.({ surahId, ayahNumber })
    },
    [onAyahLongPress]
  )

  if (words.length === 0) {
    return <View style={styles.emptyLine} />
  }

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
                number={word.textUthmani}
              />
            )
          }
          return (
            <Text
              key={`${word.surahId}-${word.ayahNumber}-${word.position}`}
              style={[styles.word, { color: textColor }]}
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
    height: LINE_HEIGHT,
    paddingHorizontal: 4,
  },
  justified: {
    justifyContent: 'space-between',
  },
  centered: {
    justifyContent: 'center',
    gap: 6,
  },
  emptyLine: {
    height: LINE_HEIGHT,
  },
  word: {
    fontFamily: 'KFGQPCHafs',
    fontSize: MUSHAF_FONT_SIZE,
    lineHeight: LINE_HEIGHT,
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

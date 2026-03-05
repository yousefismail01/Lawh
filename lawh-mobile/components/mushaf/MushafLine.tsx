import React from 'react'
import { View, Text, StyleSheet, useColorScheme, Pressable } from 'react-native'
import { AyahMarker } from './AyahMarker'
import type { Word } from '@/types/mushaf'

const MUSHAF_FONT_SIZE = 20
const LINE_HEIGHT = MUSHAF_FONT_SIZE * 2

interface MushafLineProps {
  words: Word[]
  isCentered?: boolean
  onAyahLongPress?: (info: { surahId: number; ayahNumber: number }) => void
}

export const MushafLine = React.memo(function MushafLine({
  words,
  isCentered = false,
  onAyahLongPress,
}: MushafLineProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const textColor = isDark ? '#e8e0d0' : '#1a1a1a'

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
      {words.map((word) => {
        if (word.charType === 'end') {
          const marker = (
            <AyahMarker key={`${word.surahId}-${word.ayahNumber}-end`} number={word.textUthmani} />
          )
          if (onAyahLongPress) {
            return (
              <Pressable
                key={`${word.surahId}-${word.ayahNumber}-end`}
                onLongPress={() => onAyahLongPress({ surahId: word.surahId, ayahNumber: word.ayahNumber })}
              >
                <AyahMarker number={word.textUthmani} />
              </Pressable>
            )
          }
          return marker
        }

        return (
          <Text
            key={`${word.surahId}-${word.ayahNumber}-${word.position}`}
            style={[styles.word, { color: textColor }]}
          >
            {word.textUthmani}
          </Text>
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
})

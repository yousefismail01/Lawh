import React from 'react'
import { View, Text, StyleSheet, useColorScheme } from 'react-native'

const MUSHAF_FONT_SIZE = 20
const LINE_HEIGHT = MUSHAF_FONT_SIZE * 2
const BISMILLAH_TEXT = '\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650'

interface MushafBismillahProps {
  surahId: number
}

export const MushafBismillah = React.memo(function MushafBismillah({ surahId }: MushafBismillahProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  // Al-Fatiha (surah 1): bismillah is part of ayah 1, not a separate element
  // At-Tawbah (surah 9): no bismillah
  if (surahId === 1 || surahId === 9) {
    return null
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: isDark ? '#e8e0d0' : '#1a1a1a' }]}>
        {BISMILLAH_TEXT}
      </Text>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    height: LINE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'KFGQPCHafs',
    fontSize: MUSHAF_FONT_SIZE - 2,
    lineHeight: LINE_HEIGHT,
    writingDirection: 'rtl',
    textAlign: 'center',
    includeFontPadding: false,
  },
})

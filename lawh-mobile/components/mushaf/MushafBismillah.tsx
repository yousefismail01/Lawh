import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { BISMILLAH_GLYPH } from '@/lib/data/surahNameGlyphs'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'

// COLRv1 color fonts embed color layers that ignore the CSS color property.
// In dark mode we switch to a regular font (KFGQPCHafs) that respects color,
// rendering the actual Arabic basmallah text in white.
const BASMALLAH_ARABIC = '\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064E\u0647\u0650 \u0671\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650'

interface MushafBismillahProps {
  surahId: number
}

export const MushafBismillah = React.memo(function MushafBismillah(_props: MushafBismillahProps) {
  const { isDark, textColor } = useResolvedTheme()

  return (
    <View style={styles.container}>
      {isDark ? (
        <Text
          style={[styles.bismillahDark, { color: textColor }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {BASMALLAH_ARABIC}
        </Text>
      ) : (
        <Text
          style={styles.bismillahLight}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {BISMILLAH_GLYPH}
        </Text>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  bismillahLight: {
    fontFamily: 'SurahNameV4Color',
    fontSize: 90,
    textAlign: 'center',
    includeFontPadding: false,
  },
  bismillahDark: {
    fontFamily: 'KFGQPCHafs',
    fontSize: 28,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
})

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { BISMILLAH_GLYPH } from '@/lib/data/surahNameGlyphs'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'

interface MushafBismillahProps {
  surahId: number
}

export const MushafBismillah = React.memo(function MushafBismillah(_props: MushafBismillahProps) {
  const { isDark } = useResolvedTheme()

  return (
    <View style={styles.container}>
      <Text
        style={[styles.bismillah, isDark && { color: '#FFFFFF' }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {BISMILLAH_GLYPH}
      </Text>
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
  bismillah: {
    fontFamily: 'SurahNameV4Color',
    fontSize: 90,
    textAlign: 'center',
    includeFontPadding: false,
  },
})

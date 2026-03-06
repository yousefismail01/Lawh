import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { BISMILLAH_GLYPH } from '@/lib/data/surahNameGlyphs'

interface MushafBismillahProps {
  surahId: number
  textColor?: string
}

export const MushafBismillah = React.memo(function MushafBismillah({ textColor }: MushafBismillahProps) {
  return (
    <View style={styles.container}>
      <Text
        style={[styles.bismillah, textColor ? { color: textColor } : undefined]}
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

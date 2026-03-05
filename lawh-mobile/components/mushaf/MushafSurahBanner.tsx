import React from 'react'
import { View, Text, StyleSheet, useColorScheme } from 'react-native'

const MUSHAF_FONT_SIZE = 20
const LINE_HEIGHT = MUSHAF_FONT_SIZE * 2

interface MushafSurahBannerProps {
  surahName: string
}

export const MushafSurahBanner = React.memo(function MushafSurahBanner({ surahName }: MushafSurahBannerProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isDark ? '#3a2f1f' : '#f5e6c8',
          borderColor: isDark ? '#8a7340' : '#c9a84c',
        },
      ]}
    >
      <Text
        style={[
          styles.surahName,
          { color: isDark ? '#e8e0d0' : '#1a1a1a' },
        ]}
      >
        {surahName}
      </Text>
    </View>
  )
})

const styles = StyleSheet.create({
  banner: {
    height: LINE_HEIGHT,
    borderWidth: 1.5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  surahName: {
    fontFamily: 'KFGQPCHafs',
    fontSize: MUSHAF_FONT_SIZE + 2,
    writingDirection: 'rtl',
    textAlign: 'center',
    includeFontPadding: false,
  },
})

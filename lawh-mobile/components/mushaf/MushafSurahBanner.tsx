import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface MushafSurahBannerProps {
  surahName: string
  surahId?: number
}

function surahNameLigature(surahId: number): string {
  return `surah${String(surahId).padStart(3, '0')}`
}

export const MushafSurahBanner = React.memo(function MushafSurahBanner({ surahName, surahId }: MushafSurahBannerProps) {
  return (
    <View style={styles.container}>
      {/* Banner ornament from quran-common font using "header" ligature */}
      <Text
        style={styles.bannerOrnament}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        header
      </Text>
      {/* Surah name overlaid on the banner */}
      <View style={styles.nameOverlay}>
        <Text style={styles.surahLabel}>سُورَةُ</Text>
        {surahId ? (
          <Text style={styles.surahNameV4}>
            {surahNameLigature(surahId)}
          </Text>
        ) : (
          <Text style={styles.surahNameFallback}>
            {surahName}
          </Text>
        )}
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 0,
  },
  bannerOrnament: {
    fontFamily: 'QuranCommon',
    fontSize: 60,
    color: '#000',
    textAlign: 'center',
    includeFontPadding: false,
  },
  nameOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  surahLabel: {
    fontFamily: 'KFGQPCHafs',
    fontSize: 10,
    color: '#2a4a2a',
    textAlign: 'center',
    includeFontPadding: false,
    marginBottom: -4,
  },
  surahNameV4: {
    fontFamily: 'SurahNameV4',
    fontSize: 40,
    color: '#000',
    textAlign: 'center',
    includeFontPadding: false,
  },
  surahNameFallback: {
    fontFamily: 'KFGQPCHafs',
    fontSize: 20,
    color: '#2a4a2a',
    writingDirection: 'rtl',
    textAlign: 'center',
    includeFontPadding: false,
  },
})

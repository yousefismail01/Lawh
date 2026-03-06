import React from 'react'
import { View, Text, StyleSheet, useColorScheme, Pressable } from 'react-native'
import { V4AyahText } from './V4AyahText'

interface AyahCardProps {
  surahId: number
  ayahNumber: number
  translationText?: string
  transliterationText?: string
  showTranslation: boolean
  showTransliteration?: boolean
  showArabicVerse?: boolean
  arabicFontSize?: number
  translationFontSize?: number
  onMenuPress?: () => void
}

const AyahCardInner = function AyahCardInner({
  surahId,
  ayahNumber,
  translationText,
  transliterationText,
  showTranslation,
  showTransliteration = false,
  showArabicVerse = true,
  arabicFontSize = 26,
  translationFontSize = 15,
  onMenuPress,
}: AyahCardProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const arabicColor = isDark ? '#ffffff' : '#000000'
  const translationBg = isDark ? '#1c1c1e' : '#f2f2f7'
  const translationColor = isDark ? '#ebebf5' : '#1c1c1e'
  const transliterationColor = isDark ? '#a0a0a5' : '#555555'
  const labelColor = isDark ? '#636366' : '#8e8e93'
  const separatorColor = isDark ? '#3a3a3c' : '#d1d1d6'

  return (
    <View style={styles.container}>
      <View style={[styles.separator, { backgroundColor: separatorColor }]} />

      <View style={styles.cardHeader}>
        <Text style={[styles.ayahLabel, { color: labelColor }]}>[{surahId}:{ayahNumber}]</Text>
        <Pressable onPress={onMenuPress} hitSlop={8} style={styles.menuButton}>
          <Text style={[styles.menuDots, { color: labelColor }]}>{'\u22EE'}</Text>
        </Pressable>
      </View>

      {showArabicVerse && (
        <V4AyahText
          surahId={surahId}
          ayahNumber={ayahNumber}
          fontSize={arabicFontSize}
          color={arabicColor}
          style={styles.arabic}
        />
      )}

      {showTransliteration && transliterationText ? (
        <Text style={[styles.transliteration, { color: transliterationColor }]}>
          {transliterationText}
        </Text>
      ) : null}

      {showTranslation && translationText ? (
        <View style={[styles.translationCard, { backgroundColor: translationBg }]}>
          <Text
            style={[
              styles.translation,
              { color: translationColor, fontSize: translationFontSize, lineHeight: translationFontSize * 1.6 },
            ]}
          >
            ({ayahNumber}) {translationText}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

export const AyahCard = React.memo(AyahCardInner)

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 0,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ayahLabel: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  menuButton: {
    paddingHorizontal: 4,
  },
  menuDots: {
    fontSize: 18,
    lineHeight: 18,
  },
  arabic: {
    marginBottom: 8,
  },
  transliteration: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    textAlign: 'left',
    marginBottom: 8,
  },
  translationCard: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  translation: {
    textAlign: 'left',
  },
})

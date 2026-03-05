import React from 'react'
import { View, Text, StyleSheet, useColorScheme } from 'react-native'
import { V4AyahText } from './V4AyahText'

interface AyahCardProps {
  surahId: number
  ayahNumber: number
  translationText?: string
  showTranslation: boolean
  showArabicVerse?: boolean
  arabicFontSize?: number
  translationFontSize?: number
}

const AyahCardInner = function AyahCardInner({
  surahId,
  ayahNumber,
  translationText,
  showTranslation,
  showArabicVerse = true,
  arabicFontSize = 26,
  translationFontSize = 15,
}: AyahCardProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const arabicColor = isDark ? '#ffffff' : '#000000'
  const translationBg = isDark ? '#1c1c1e' : '#f2f2f7'
  const translationColor = isDark ? '#ebebf5' : '#1c1c1e'

  return (
    <View style={styles.container}>
      {showArabicVerse && (
        <V4AyahText
          surahId={surahId}
          ayahNumber={ayahNumber}
          fontSize={arabicFontSize}
          color={arabicColor}
          style={styles.arabic}
        />
      )}

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
    marginBottom: 16,
  },
  arabic: {
    marginBottom: 8,
  },
  translationCard: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  translation: {
    textAlign: 'left',
  },
})

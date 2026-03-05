import React from 'react'
import { View, Text, StyleSheet, useColorScheme } from 'react-native'

interface AyahCardProps {
  surahId: number
  ayahNumber: number
  arabicText: string
  translationText?: string
  showTranslation: boolean
}

const AyahCardInner = function AyahCardInner({
  ayahNumber,
  arabicText,
  translationText,
  showTranslation,
}: AyahCardProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const arabicColor = isDark ? '#e8e0d0' : '#1c1812'
  const translationBg = isDark ? '#2a241c' : '#f5efe3'
  const translationColor = isDark ? '#c0b8a0' : '#3a3520'

  return (
    <View style={styles.container}>
      {/* Arabic text — directly on background, no card */}
      <Text style={[styles.arabic, { color: arabicColor }]}>
        {arabicText}
      </Text>

      {/* Translation in a subtle card */}
      {showTranslation && translationText ? (
        <View style={[styles.translationCard, { backgroundColor: translationBg }]}>
          <Text style={[styles.translation, { color: translationColor }]}>
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
    fontSize: 26,
    lineHeight: 48,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'KFGQPCHafs',
    marginBottom: 8,
  },
  translationCard: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  translation: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'left',
  },
})

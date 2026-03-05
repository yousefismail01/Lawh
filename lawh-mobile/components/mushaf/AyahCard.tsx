import React from 'react'
import { View, Text, StyleSheet, useColorScheme } from 'react-native'

interface AyahCardProps {
  surahId: number
  ayahNumber: number
  arabicText: string
  translationText?: string
  surahName?: string
  showTranslation: boolean
}

const AyahCardInner = function AyahCardInner({
  surahId,
  ayahNumber,
  arabicText,
  translationText,
  surahName,
  showTranslation,
}: AyahCardProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const cardBg = isDark ? '#2a241c' : '#faf3e0'
  const textColor = isDark ? '#e8e0d0' : '#1c1812'
  const headerColor = isDark ? '#b0a890' : '#6b5c3e'
  const dividerColor = isDark ? 'rgba(200, 168, 78, 0.2)' : 'rgba(0, 0, 0, 0.1)'
  const translationColor = isDark ? '#c0b8a0' : '#3a3520'

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      {/* Header row */}
      <Text style={[styles.header, { color: headerColor }]}>
        {surahName ?? `Surah ${surahId}`} {surahId}:{ayahNumber}
      </Text>

      {/* Arabic text */}
      <Text style={[styles.arabic, { color: textColor }]}>
        {arabicText}
      </Text>

      {/* Translation */}
      {showTranslation && translationText ? (
        <>
          <View style={[styles.divider, { backgroundColor: dividerColor }]} />
          <Text style={[styles.translation, { color: translationColor }]}>
            {translationText}
          </Text>
        </>
      ) : null}
    </View>
  )
}

export const AyahCard = React.memo(AyahCardInner)

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  arabic: {
    fontSize: 24,
    lineHeight: 42,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: 'KFGQPCHafs',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  translation: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'left',
  },
})

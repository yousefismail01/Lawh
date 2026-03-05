import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface MushafPageHeaderProps {
  surahName: string
  surahId?: number
  juz: number
  pageNumber: number
}

function surahNameLigature(surahId: number): string {
  return `surah${String(surahId).padStart(3, '0')}`
}

export const MushafPageHeader = React.memo(function MushafPageHeader({
  surahName,
  surahId,
  juz,
  pageNumber,
}: MushafPageHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.surahNameV4}>
          {surahId ? surahNameLigature(surahId) : surahName}
        </Text>
        <Text style={styles.headerText}>
          الجزء {juz}
        </Text>
      </View>
      <View style={styles.separator} />
    </View>
  )
})

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: 2,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
    paddingHorizontal: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#999',
  },
  surahNameV4: {
    fontFamily: 'SurahNameV4',
    fontSize: 28,
    color: '#000',
    includeFontPadding: false,
  },
  separator: {
    height: 0.5,
    backgroundColor: '#e0e0e0',
  },
})

import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { SurahInfo } from '@/lib/data/contentsData'

interface SurahRowProps {
  surah: SurahInfo
  onSelect: (pageStart: number) => void
}

function SurahRowInner({ surah, onSelect }: SurahRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={() => onSelect(surah.pageStart)}
    >
      <View style={styles.numberCircle}>
        <Text style={styles.numberText}>{surah.id}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{surah.nameSimple}</Text>
        <Text style={styles.subtitle}>
          {surah.versesCount} Verses{' \u2022 '}
          {surah.revelationPlace === 'makkah' ? 'Meccan' : 'Medinan'}
        </Text>
      </View>
      <Text style={styles.page}>p. {surah.pageStart}</Text>
    </Pressable>
  )
}

export const SurahRow = React.memo(SurahRowInner)

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingRight: 40, // leave room for JuzIndex on right edge
    backgroundColor: '#faf3e0',
  },
  pressed: {
    backgroundColor: '#f0e8d0',
  },
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#c4b48a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  numberText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b5c3a',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b5c3a',
  },
  page: {
    fontSize: 12,
    color: '#6b5c3a',
    marginLeft: 8,
  },
})

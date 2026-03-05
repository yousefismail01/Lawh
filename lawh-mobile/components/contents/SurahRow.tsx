import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { SurahInfo } from '@/lib/data/contentsData'

interface SurahRowProps {
  surah: SurahInfo
  isCurrent?: boolean
  onSelect: (pageStart: number) => void
}

function SurahRowInner({ surah, isCurrent, onSelect }: SurahRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, isCurrent && styles.current, pressed && styles.pressed]}
      onPress={() => onSelect(surah.pageStart)}
    >
      <View style={[styles.numberCircle, isCurrent && styles.numberCircleCurrent]}>
        <Text style={[styles.numberText, isCurrent && styles.numberTextCurrent]}>{surah.id}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, isCurrent && styles.nameCurrent]}>{surah.nameSimple}</Text>
        <Text style={styles.subtitle}>
          {surah.versesCount} Verses{' \u2022 '}
          {surah.revelationPlace === 'makkah' ? 'Meccan' : 'Medinan'}
        </Text>
      </View>
      {isCurrent && <Text style={styles.currentLabel}>Reading</Text>}
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
    paddingRight: 40,
    backgroundColor: '#fff',
  },
  current: {
    backgroundColor: '#f0f0f0',
  },
  pressed: {
    backgroundColor: '#f5f5f5',
  },
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  numberCircleCurrent: {
    borderColor: '#333',
    backgroundColor: '#333',
  },
  numberText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  numberTextCurrent: {
    color: '#fff',
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
  nameCurrent: {
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
  },
  currentLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
    marginRight: 6,
  },
  page: {
    fontSize: 12,
    color: '#888',
    marginLeft: 8,
  },
})

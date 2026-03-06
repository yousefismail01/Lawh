import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { SurahInfo } from '@/lib/data/contentsData'

function surahNameLigature(surahId: number): string {
  return `surah${String(surahId).padStart(3, '0')}`
}

interface SurahRowColors {
  bg: string
  currentBg: string
  text: string
  muted: string
  calligraphy: string
  border: string
}

interface SurahRowProps {
  surah: SurahInfo
  isCurrent?: boolean
  onSelect: (pageStart: number) => void
  colors?: SurahRowColors
}

function SurahRowInner({ surah, isCurrent, onSelect, colors }: SurahRowProps) {
  const bg = colors?.bg ?? '#fff'
  const currentBg = colors?.currentBg ?? '#f0f0f0'
  const text = colors?.text ?? '#1a1a1a'
  const muted = colors?.muted ?? '#888'
  const calligraphy = colors?.calligraphy ?? '#333'
  const border = colors?.border ?? '#ddd'

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: isCurrent ? currentBg : bg },
        pressed && { opacity: 0.7 },
      ]}
      onPress={() => onSelect(surah.pageStart)}
    >
      <View style={[
        styles.numberCircle,
        { borderColor: isCurrent ? text : border },
        isCurrent && { backgroundColor: text },
      ]}>
        <Text style={[styles.numberText, { color: isCurrent ? bg : text }]}>{surah.id}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: text }, isCurrent && styles.nameCurrent]}>{surah.nameSimple}</Text>
        <Text style={[styles.subtitle, { color: muted }]}>
          {surah.versesCount} Verses{' \u2022 '}
          {surah.revelationPlace === 'makkah' ? 'Meccan' : 'Medinan'}
          {' \u2022 '}Page {surah.pageStart}
        </Text>
      </View>
      <Text style={[styles.surahCalligraphy, { color: calligraphy }]}>{surahNameLigature(surah.id)}</Text>
    </Pressable>
  )
}

export const SurahRow = React.memo(SurahRowInner)

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    paddingHorizontal: 16,
    paddingRight: 40,
  },
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  numberText: {
    fontSize: 11,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  nameCurrent: {
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  surahCalligraphy: {
    fontFamily: 'SurahNameV4',
    fontSize: 30,
    marginLeft: 8,
    includeFontPadding: false,
  },
})

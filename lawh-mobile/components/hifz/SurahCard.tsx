/**
 * SurahCard - Compact card for the 114-surah hifz grid.
 *
 * Color-coded by memorization status:
 * - not_started: neutral gray
 * - in_progress: blue tint
 * - memorized: green
 * - needs_review: amber/warning
 */

import React from 'react'
import { Pressable, Text, StyleSheet, Dimensions } from 'react-native'
import type { HifzStatus } from '@/lib/sr/types'

const GRID_COLUMNS = 5
const GRID_PADDING = 16
const GRID_GAP = 6
const CARD_SIZE =
  (Dimensions.get('window').width - GRID_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) /
  GRID_COLUMNS

interface SurahCardProps {
  surahNumber: number
  status: HifzStatus
  onPress: () => void
  isDark: boolean
}

function statusColor(status: HifzStatus, isDark: boolean): string {
  switch (status) {
    case 'not_started':
      return isDark ? '#2a2a2a' : '#f0f0f0'
    case 'in_progress':
      return isDark ? '#1a3a5c' : '#dbeafe'
    case 'memorized':
      return isDark ? '#1a4a2a' : '#d1fae5'
    case 'needs_review':
      return isDark ? '#5c3a1a' : '#fef3c7'
  }
}

function SurahCardInner({ surahNumber, status, onPress, isDark }: SurahCardProps) {
  const bg = statusColor(status, isDark)
  const textColor = isDark ? '#fff' : '#1a1a1a'

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: bg },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.number, { color: textColor }]}>{surahNumber}</Text>
    </Pressable>
  )
}

export const SurahCard = React.memo(SurahCardInner)

export { CARD_SIZE, GRID_GAP }

const styles = StyleSheet.create({
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
})

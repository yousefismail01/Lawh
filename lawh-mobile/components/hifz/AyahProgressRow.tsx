/**
 * AyahProgressRow - Single row displaying per-ayah hifz strength.
 *
 * Shows a colored strength bar, ayah number, last reviewed date,
 * and next review due date.
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface AyahProgressRowProps {
  ayahNumber: number
  strengthScore: number
  lastReviewed: string | null
  nextDue: string | null
  mistakeCount: number
  isDark: boolean
}

function barColor(strength: number): string {
  if (strength < 0.3) return '#ef4444'
  if (strength < 0.6) return '#f97316'
  if (strength < 0.8) return '#eab308'
  return '#22c55e'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return '--'
  }
}

function AyahProgressRowInner({
  ayahNumber,
  strengthScore,
  lastReviewed,
  nextDue,
  mistakeCount,
  isDark,
}: AyahProgressRowProps) {
  const textColor = isDark ? '#fff' : '#1a1a1a'
  const mutedColor = isDark ? '#888' : '#999'
  const percentage = Math.round(strengthScore * 100)
  const color = barColor(strengthScore)

  return (
    <View style={styles.row}>
      <Text style={[styles.ayahNum, { color: textColor }]}>{ayahNumber}</Text>
      <View style={styles.barContainer}>
        <View
          style={[
            styles.bar,
            {
              width: `${percentage}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={[styles.percentage, { color: textColor }]}>{percentage}%</Text>
      <View style={styles.dates}>
        <Text style={[styles.dateText, { color: mutedColor }]}>
          Last: {formatDate(lastReviewed)}
        </Text>
        <Text style={[styles.dateText, { color: mutedColor }]}>
          Next: {formatDate(nextDue)}
        </Text>
      </View>
    </View>
  )
}

export const AyahProgressRow = React.memo(AyahProgressRowInner)

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  ayahNum: {
    width: 28,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  barContainer: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(128,128,128,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
  percentage: {
    width: 36,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  dates: {
    width: 80,
    gap: 1,
  },
  dateText: {
    fontSize: 10,
  },
})

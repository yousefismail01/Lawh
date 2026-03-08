/**
 * GradeBar - 4-button SM-2+ grade bar (Again/Hard/Good/Easy)
 *
 * Shows projected next interval below each grade label.
 * Medium haptic feedback on press.
 */

import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import type { Grade } from '@/lib/sr/types'

interface GradeBarProps {
  onGrade: (grade: Grade) => void
  /** Pre-computed projected intervals for display (e.g. "1d", "6d") */
  projections: Record<Grade, string>
  isDark: boolean
}

const GRADES: { grade: Grade; label: string; lightColor: string; darkColor: string }[] = [
  { grade: 0, label: 'Again', lightColor: '#FF3B30', darkColor: '#FF453A' },
  { grade: 2, label: 'Hard', lightColor: '#FF9500', darkColor: '#FF9F0A' },
  { grade: 3, label: 'Good', lightColor: '#34C759', darkColor: '#30D158' },
  { grade: 5, label: 'Easy', lightColor: '#007AFF', darkColor: '#0A84FF' },
]

export const GradeBar = React.memo(function GradeBar({
  onGrade,
  projections,
  isDark,
}: GradeBarProps) {
  const handlePress = async (grade: Grade) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onGrade(grade)
  }

  return (
    <View style={styles.container}>
      {GRADES.map(({ grade, label, lightColor, darkColor }) => {
        const color = isDark ? darkColor : lightColor
        return (
          <Pressable
            key={grade}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7',
                borderColor: color,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={() => handlePress(grade)}
          >
            <Text style={[styles.label, { color }]}>{label}</Text>
            <Text style={[styles.interval, { color: isDark ? '#999' : '#666' }]}>
              {projections[grade]}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  interval: {
    fontSize: 11,
    fontWeight: '500',
  },
})

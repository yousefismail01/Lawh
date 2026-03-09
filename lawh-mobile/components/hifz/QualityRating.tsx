/**
 * QualityRating - 1-5 quality rating button row
 *
 * Used for rating dhor/sabqi review quality in guided Madinah sessions.
 * Each button triggers haptic feedback on press.
 */

import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'

interface QualityRatingProps {
  onRate: (score: number) => void
  disabled?: boolean
}

const RATINGS = [
  { score: 1, label: 'Forgot', color: '#FF3B30' },
  { score: 2, label: 'Weak', color: '#FF9500' },
  { score: 3, label: 'Okay', color: '#FFCC00' },
  { score: 4, label: 'Good', color: '#34C759' },
  { score: 5, label: 'Perfect', color: '#007AFF' },
] as const

export function QualityRating({ onRate, disabled = false }: QualityRatingProps) {
  const handlePress = (score: number) => {
    if (disabled) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onRate(score)
  }

  return (
    <View style={styles.container}>
      {RATINGS.map(({ score, label, color }) => (
        <Pressable
          key={score}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: color + '20',
              borderColor: color,
              opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => handlePress(score)}
          disabled={disabled}
        >
          <Text style={[styles.score, { color }]}>{score}</Text>
          <Text style={[styles.label, { color }]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
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
  score: {
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
})

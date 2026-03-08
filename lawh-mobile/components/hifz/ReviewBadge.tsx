/**
 * ReviewBadge - Tappable card showing review due count.
 *
 * Displayed on the Dashboard tab to drive review engagement.
 * Shows "All caught up!" when there are no reviews due.
 */

import React from 'react'
import { Pressable, Text, View, StyleSheet } from 'react-native'
import { useHifzStore } from '@/stores/hifzStore'

interface ReviewBadgeProps {
  onPress: () => void
  isDark: boolean
}

function buildColors(isDark: boolean) {
  return {
    bg: isDark ? '#1a3a2a' : '#d1fae5',
    text: isDark ? '#4ade80' : '#16a34a',
    sub: isDark ? '#86efac' : '#15803d',
    caughtUpBg: isDark ? '#1e1e1e' : '#f5f5f5',
    caughtUpText: isDark ? '#888' : '#999',
  }
}

export function ReviewBadge({ onPress, isDark }: ReviewBadgeProps) {
  const reviewDueCount = useHifzStore((s) => s.reviewDueCount)
  const colors = buildColors(isDark)

  if (reviewDueCount === 0) {
    return (
      <View style={[styles.card, { backgroundColor: colors.caughtUpBg }]}>
        <Text style={[styles.caughtUp, { color: colors.caughtUpText }]}>All caught up!</Text>
        <Text style={[styles.subtitle, { color: colors.caughtUpText }]}>
          No ayahs due for review
        </Text>
      </View>
    )
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.bg },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.count, { color: colors.text }]}>{reviewDueCount}</Text>
      <Text style={[styles.subtitle, { color: colors.sub }]}>
        ayah{reviewDueCount !== 1 ? 's' : ''} due for review
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  count: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  caughtUp: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  pressed: {
    opacity: 0.8,
  },
})

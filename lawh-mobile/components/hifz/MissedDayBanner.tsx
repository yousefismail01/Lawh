/**
 * MissedDayBanner - Recovery prompt banner shown when student returns after absence.
 */

import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface MissedDayBannerProps {
  missedDays: number
  isDark: boolean
  onDismiss?: () => void
}

export function MissedDayBanner({ missedDays, isDark, onDismiss }: MissedDayBannerProps) {
  if (missedDays <= 0) return null

  const bgColor = isDark ? '#3D2E00' : '#FFF8E1'
  const textColor = isDark ? '#FFD60A' : '#795600'
  const iconColor = isDark ? '#fbbf24' : '#d97706'

  return (
    <View style={[styles.banner, { backgroundColor: bgColor }]}>
      <Ionicons name="alert-circle-outline" size={20} color={iconColor} />
      <Text style={[styles.text, { color: textColor }]}>
        Welcome back! You missed {missedDays} day{missedDays !== 1 ? 's' : ''}. Your
        schedule has been adjusted.
      </Text>
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Ionicons name="close" size={18} color={textColor} />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
})

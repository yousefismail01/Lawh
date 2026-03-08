/**
 * SessionSummary - Post-session results modal
 *
 * Displays ayahs reviewed, grade breakdown, strength change, and time elapsed.
 */

import React from 'react'
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'

export interface SessionResults {
  ayahsReviewed: number
  grades: { again: number; hard: number; good: number; easy: number }
  avgStrengthBefore: number
  avgStrengthAfter: number
  totalTime: number // in seconds
}

interface SessionSummaryProps {
  visible: boolean
  onClose: () => void
  results: SessionResults
  /** Session type label */
  sessionType?: 'Review' | 'Memorization'
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export const SessionSummary = React.memo(function SessionSummary({
  visible,
  onClose,
  results,
  sessionType = 'Review',
}: SessionSummaryProps) {
  const { isDark, backgroundColor, textColor, secondaryTextColor, cardColor, borderColor, accentColor } = useResolvedTheme()

  const strengthDelta = results.avgStrengthAfter - results.avgStrengthBefore
  const strengthDirection = strengthDelta >= 0 ? '+' : ''
  const strengthColor = strengthDelta >= 0
    ? (isDark ? '#30D158' : '#34C759')
    : (isDark ? '#FF453A' : '#FF3B30')

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor }]}>
          {/* Header */}
          <Ionicons
            name="checkmark-circle"
            size={48}
            color={isDark ? '#30D158' : '#34C759'}
            style={styles.checkIcon}
          />
          <Text style={[styles.title, { color: textColor }]}>
            {sessionType} Complete
          </Text>
          <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
            {results.ayahsReviewed} ayah{results.ayahsReviewed !== 1 ? 's' : ''} reviewed
          </Text>

          {/* Grade breakdown */}
          <View style={[styles.gradeRow, { backgroundColor: cardColor, borderColor }]}>
            <GradeCount label="Again" count={results.grades.again} color={isDark ? '#FF453A' : '#FF3B30'} textColor={textColor} />
            <GradeCount label="Hard" count={results.grades.hard} color={isDark ? '#FF9F0A' : '#FF9500'} textColor={textColor} />
            <GradeCount label="Good" count={results.grades.good} color={isDark ? '#30D158' : '#34C759'} textColor={textColor} />
            <GradeCount label="Easy" count={results.grades.easy} color={isDark ? '#0A84FF' : '#007AFF'} textColor={textColor} />
          </View>

          {/* Strength change */}
          <View style={[styles.strengthRow, { backgroundColor: cardColor, borderColor }]}>
            <Text style={[styles.strengthLabel, { color: secondaryTextColor }]}>Strength</Text>
            <View style={styles.strengthValues}>
              <Text style={[styles.strengthValue, { color: textColor }]}>
                {formatPercent(results.avgStrengthBefore)}
              </Text>
              <Ionicons name="arrow-forward" size={14} color={secondaryTextColor} />
              <Text style={[styles.strengthValue, { color: strengthColor }]}>
                {formatPercent(results.avgStrengthAfter)}
              </Text>
              <Text style={[styles.strengthDelta, { color: strengthColor }]}>
                ({strengthDirection}{formatPercent(Math.abs(strengthDelta))})
              </Text>
            </View>
          </View>

          {/* Time */}
          <Text style={[styles.timeText, { color: secondaryTextColor }]}>
            Time: {formatTime(results.totalTime)}
          </Text>

          {/* Done button */}
          <Pressable
            style={({ pressed }) => [
              styles.doneButton,
              { backgroundColor: accentColor, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={onClose}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
})

function GradeCount({ label, count, color, textColor }: { label: string; count: number; color: string; textColor: string }) {
  return (
    <View style={styles.gradeItem}>
      <Text style={[styles.gradeCount, { color }]}>{count}</Text>
      <Text style={[styles.gradeLabel, { color: textColor }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  checkIcon: {
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 8,
  },
  gradeRow: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'space-around',
  },
  gradeItem: {
    alignItems: 'center',
    gap: 2,
  },
  gradeCount: {
    fontSize: 20,
    fontWeight: '700',
  },
  gradeLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  strengthRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  strengthLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  strengthValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strengthValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  strengthDelta: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 13,
    marginTop: 4,
  },
  doneButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})

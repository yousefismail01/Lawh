/**
 * MadinahSessionSummary - Post-session summary modal for guided Madinah sessions
 *
 * Shows tier-by-tier results (sabaq/sabqi/dhor), quality ratings,
 * total time, and optional level transition banner.
 */

import React from 'react'
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'
import type { StudentLevel } from '@/lib/algorithm'
import { getLevelConfig } from '@/lib/algorithm'

interface MadinahSessionSummaryProps {
  visible: boolean
  onClose: () => void
  sabaqPages: number
  sabqiPages: number
  sabqiRatings: Record<number, number> // juz -> quality
  dhorPages: number
  dhorRatings: Record<number, number> // juz -> quality
  totalMinutes: number
  levelTransition?: { from: StudentLevel; to: StudentLevel } | null
}

function formatMinutes(minutes: number): string {
  if (minutes < 1) return '<1 min'
  const mins = Math.floor(minutes)
  return `${mins} min${mins !== 1 ? 's' : ''}`
}

function computeAvgRating(ratings: Record<number, number>): number | null {
  const values = Object.values(ratings)
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

function getRatingColor(avg: number): string {
  if (avg >= 4) return '#34C759'
  if (avg >= 3) return '#FFCC00'
  if (avg >= 2) return '#FF9500'
  return '#FF3B30'
}

// Tier colors matching the session card UI
const TIER_COLORS = {
  sabaq: '#34C759',  // green
  sabqi: '#007AFF',  // blue
  dhor: '#FF9500',   // amber
}

export function MadinahSessionSummary({
  visible,
  onClose,
  sabaqPages,
  sabqiPages,
  sabqiRatings,
  dhorPages,
  dhorRatings,
  totalMinutes,
  levelTransition,
}: MadinahSessionSummaryProps) {
  const {
    isDark,
    backgroundColor,
    textColor,
    secondaryTextColor,
    cardColor,
    borderColor,
    accentColor,
  } = useResolvedTheme()

  const sabqiAvg = computeAvgRating(sabqiRatings)
  const dhorAvg = computeAvgRating(dhorRatings)

  // Check if any dhor ratings are weak (<= 2)
  const hasWeakDhor = Object.values(dhorRatings).some((r) => r <= 2)

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
            Session Complete
          </Text>

          {/* Tier rows */}
          <View style={[styles.tiersContainer, { backgroundColor: cardColor, borderColor }]}>
            {/* Sabaq */}
            <TierRow
              icon="book-outline"
              label="New Memorization"
              color={TIER_COLORS.sabaq}
              textColor={textColor}
              secondaryColor={secondaryTextColor}
              detail={sabaqPages > 0 ? `${sabaqPages} page${sabaqPages !== 1 ? 's' : ''}` : 'Paused'}
              detailMuted={sabaqPages === 0}
            />

            <View style={[styles.tierDivider, { backgroundColor: borderColor }]} />

            {/* Sabqi */}
            <TierRow
              icon="reload-outline"
              label="Recent Review"
              color={TIER_COLORS.sabqi}
              textColor={textColor}
              secondaryColor={secondaryTextColor}
              detail={`${sabqiPages} page${sabqiPages !== 1 ? 's' : ''}`}
              rating={sabqiAvg}
            />

            <View style={[styles.tierDivider, { backgroundColor: borderColor }]} />

            {/* Dhor */}
            <TierRow
              icon="library-outline"
              label="Revision"
              color={TIER_COLORS.dhor}
              textColor={textColor}
              secondaryColor={secondaryTextColor}
              detail={`${dhorPages} page${dhorPages !== 1 ? 's' : ''}`}
              rating={dhorAvg}
            />
          </View>

          {/* Weak dhor warning */}
          {hasWeakDhor && (
            <Text style={[styles.weakWarning, { color: '#FF9500' }]}>
              Weak juz will return in 2 days
            </Text>
          )}

          {/* Time */}
          <Text style={[styles.timeText, { color: secondaryTextColor }]}>
            Time: {formatMinutes(totalMinutes)}
          </Text>

          {/* Level transition banner */}
          {levelTransition && (
            <LevelTransitionBanner
              from={levelTransition.from}
              to={levelTransition.to}
              isDark={isDark}
            />
          )}

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
}

function TierRow({
  icon,
  label,
  color,
  textColor,
  secondaryColor,
  detail,
  detailMuted,
  rating,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string
  color: string
  textColor: string
  secondaryColor: string
  detail: string
  detailMuted?: boolean
  rating?: number | null
}) {
  return (
    <View style={styles.tierRow}>
      <View style={styles.tierLeft}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={[styles.tierLabel, { color: textColor }]}>{label}</Text>
      </View>
      <View style={styles.tierRight}>
        <Text
          style={[
            styles.tierDetail,
            { color: detailMuted ? secondaryColor : textColor },
          ]}
        >
          {detail}
        </Text>
        {rating != null && (
          <Text style={[styles.tierRating, { color: getRatingColor(rating) }]}>
            {rating.toFixed(1)}/5
          </Text>
        )}
      </View>
    </View>
  )
}

function LevelTransitionBanner({
  from,
  to,
  isDark,
}: {
  from: StudentLevel
  to: StudentLevel
  isDark: boolean
}) {
  const fromConfig = getLevelConfig(from)
  const toConfig = getLevelConfig(to)

  const isUpgrade = to > from
  const bannerBg = isUpgrade
    ? (isDark ? '#1A3A2A' : '#E8F5E9')
    : (isDark ? '#3A2A1A' : '#FFF3E0')
  const bannerBorder = isUpgrade
    ? (isDark ? '#2D6A4F' : '#66BB6A')
    : (isDark ? '#6A4F2D' : '#FFA726')
  const bannerText = isUpgrade
    ? (isDark ? '#30D158' : '#2E7D32')
    : (isDark ? '#FF9F0A' : '#E65100')

  return (
    <View style={[styles.transitionBanner, { backgroundColor: bannerBg, borderColor: bannerBorder }]}>
      <Text style={[styles.transitionTitle, { color: bannerText }]}>
        Level {from} {isUpgrade ? '\u2192' : '\u2192'} Level {to}
      </Text>
      <Text style={[styles.transitionDetail, { color: bannerText }]}>
        Dhor pages/day: {fromConfig.dhorPagesPerDay} {'\u2192'} {toConfig.dhorPagesPerDay}
      </Text>
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
    marginBottom: 4,
  },
  tiersContainer: {
    width: '100%',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  tierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  tierRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tierDetail: {
    fontSize: 14,
    fontWeight: '500',
  },
  tierRating: {
    fontSize: 14,
    fontWeight: '700',
  },
  tierDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  weakWarning: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  timeText: {
    fontSize: 13,
    marginTop: 4,
  },
  transitionBanner: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  transitionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  transitionDetail: {
    fontSize: 13,
    fontWeight: '500',
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

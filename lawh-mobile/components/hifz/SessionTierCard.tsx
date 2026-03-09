/**
 * SessionTierCard - Individual tier card for the guided session flow.
 *
 * Represents one tier (sabaq/sabqi/dhor) with assignment details,
 * completion state, and quality rating interaction.
 */

import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'
import { QualityRating } from './QualityRating'

interface SessionTierCardProps {
  tier: 'sabaq' | 'sabqi' | 'dhor'
  assignment: string // e.g., "Juz 5, pages 82-86"
  pages: number
  status: 'upcoming' | 'active' | 'completed'
  rating?: number // 1-5 if completed
  isPaused?: boolean // for sabaq pause state
  pauseReason?: string // from getSabaqAllowance().reason
  onMarkComplete: () => void
  onRate?: (score: number) => void // for sabqi/dhor
}

const TIER_META: Record<
  string,
  {
    icon: React.ComponentProps<typeof Ionicons>['name']
    label: string
    lightColor: string
    darkColor: string
    lightBg: string
    darkBg: string
  }
> = {
  sabaq: {
    icon: 'book-outline',
    label: 'New Memorization',
    lightColor: '#16a34a',
    darkColor: '#4ade80',
    lightBg: 'rgba(22,163,74,0.08)',
    darkBg: 'rgba(74,222,128,0.12)',
  },
  sabqi: {
    icon: 'reload-outline',
    label: 'Recent Review',
    lightColor: '#2563eb',
    darkColor: '#60a5fa',
    lightBg: 'rgba(37,99,235,0.08)',
    darkBg: 'rgba(96,165,250,0.12)',
  },
  dhor: {
    icon: 'library-outline',
    label: 'Revision',
    lightColor: '#d97706',
    darkColor: '#fbbf24',
    lightBg: 'rgba(217,119,6,0.08)',
    darkBg: 'rgba(251,191,36,0.12)',
  },
}

const RATING_LABELS: Record<number, string> = {
  1: 'Forgot',
  2: 'Weak',
  3: 'Okay',
  4: 'Good',
  5: 'Perfect',
}

export function SessionTierCard({
  tier,
  assignment,
  pages,
  status,
  rating,
  isPaused,
  pauseReason,
  onMarkComplete,
  onRate,
}: SessionTierCardProps) {
  const { isDark, cardColor, borderColor, textColor, secondaryTextColor } =
    useResolvedTheme()

  const meta = TIER_META[tier]
  const tierColor = isDark ? meta.darkColor : meta.lightColor
  const tierBg = isDark ? meta.darkBg : meta.lightBg

  const isUpcoming = status === 'upcoming'
  const isActive = status === 'active'
  const isCompleted = status === 'completed'

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardColor,
          borderColor: isActive ? tierColor : borderColor,
          borderWidth: isActive ? 1.5 : StyleSheet.hairlineWidth,
          opacity: isUpcoming ? 0.5 : 1,
        },
      ]}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={[styles.iconBox, { backgroundColor: tierBg }]}>
          <Ionicons name={meta.icon} size={20} color={tierColor} />
        </View>
        <View style={styles.headerContent}>
          <Text style={[styles.tierLabel, { color: textColor }]}>
            {meta.label}
          </Text>
          {!isPaused && (
            <Text style={[styles.assignment, { color: secondaryTextColor }]}>
              {assignment}
            </Text>
          )}
        </View>
        {!isPaused && pages > 0 && (
          <View style={[styles.pagePill, { backgroundColor: tierBg }]}>
            <Text style={[styles.pagePillText, { color: tierColor }]}>
              {pages} pg
            </Text>
          </View>
        )}
        {isCompleted && (
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={isDark ? '#30D158' : '#34C759'}
          />
        )}
      </View>

      {/* Paused state for sabaq */}
      {isPaused && isActive && (
        <View
          style={[
            styles.pausedContainer,
            {
              backgroundColor: isDark
                ? 'rgba(251,191,36,0.1)'
                : 'rgba(245,158,11,0.08)',
              borderColor: isDark
                ? 'rgba(251,191,36,0.2)'
                : 'rgba(245,158,11,0.15)',
            },
          ]}
        >
          <Ionicons
            name="pause-circle-outline"
            size={20}
            color={isDark ? '#fbbf24' : '#d97706'}
          />
          <View style={styles.pausedTextContainer}>
            <Text
              style={[
                styles.pausedReason,
                { color: isDark ? '#fbbf24' : '#92400e' },
              ]}
            >
              {pauseReason || 'Sabaq paused'}
            </Text>
            <Text
              style={[
                styles.pausedHadith,
                { color: isDark ? '#d4a03a' : '#78350f' },
              ]}
            >
              "Commit yourselves to the Quran, for it escapes faster than a
              camel from its tying rope."
            </Text>
          </View>
        </View>
      )}

      {/* Active sabaq: mark complete button */}
      {isActive && tier === 'sabaq' && !isPaused && (
        <Pressable
          style={({ pressed }) => [
            styles.completeButton,
            {
              backgroundColor: tierColor,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={onMarkComplete}
        >
          <Ionicons name="checkmark-outline" size={18} color="#fff" />
          <Text style={styles.completeButtonText}>
            I've completed my sabaq
          </Text>
        </Pressable>
      )}

      {/* Active sabqi/dhor: quality rating */}
      {isActive && tier !== 'sabaq' && onRate && (
        <View style={styles.ratingContainer}>
          <Text
            style={[styles.ratingPrompt, { color: secondaryTextColor }]}
          >
            Rate your review quality:
          </Text>
          <QualityRating onRate={onRate} />
        </View>
      )}

      {/* Completed rating display */}
      {isCompleted && rating != null && (
        <View style={styles.ratedRow}>
          <Text style={[styles.ratedLabel, { color: secondaryTextColor }]}>
            Rating:
          </Text>
          <Text style={[styles.ratedValue, { color: tierColor }]}>
            {rating}/5 {RATING_LABELS[rating] ?? ''}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  tierLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  assignment: {
    fontSize: 13,
    marginTop: 2,
  },
  pagePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  pagePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pausedContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  pausedTextContainer: {
    flex: 1,
  },
  pausedReason: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  pausedHadith: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 14,
    gap: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  ratingContainer: {
    marginTop: 14,
    gap: 8,
  },
  ratingPrompt: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  ratedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  ratedLabel: {
    fontSize: 13,
  },
  ratedValue: {
    fontSize: 14,
    fontWeight: '700',
  },
})

/**
 * DhorCycleTracker - Linear progress bar showing position within the dhor cycle.
 *
 * Displays current day, per-juz quality segments, and remaining days.
 */

import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { DhorCycle } from '@/lib/algorithm'

interface DhorCycleTrackerProps {
  dhorCycle: DhorCycle | null
  dhorDayNumber: number
  qualityScores: Record<number, number>
  isDark: boolean
}

function getQualityColor(quality: number, isDark: boolean): string {
  if (quality >= 4.0) return isDark ? '#30D158' : '#34C759'
  if (quality >= 3.0) return isDark ? '#FFD60A' : '#FFCC00'
  if (quality >= 2.0) return isDark ? '#FF9F0A' : '#FF9500'
  return isDark ? '#FF453A' : '#FF3B30'
}

interface JuzSegment {
  juz: number
  count: number
}

export function DhorCycleTracker({
  dhorCycle,
  dhorDayNumber,
  qualityScores,
  isDark,
}: DhorCycleTrackerProps) {
  if (!dhorCycle || dhorCycle.cycleLengthDays === 0) return null

  const currentDay = (dhorDayNumber % dhorCycle.cycleLengthDays) + 1
  const progress = currentDay / dhorCycle.cycleLengthDays
  const remainingDays = dhorCycle.cycleLengthDays - currentDay

  // Group consecutive entries by juz for segment display
  const juzSegments = useMemo(() => {
    const segments: JuzSegment[] = []
    for (const entry of dhorCycle.entries) {
      const last = segments[segments.length - 1]
      if (last && last.juz === entry.juz) {
        last.count++
      } else {
        segments.push({ juz: entry.juz, count: 1 })
      }
    }
    return segments
  }, [dhorCycle.entries])

  // Count unique reviewed juz (those before current day in the cycle)
  const reviewedJuz = useMemo(() => {
    const seen = new Set<number>()
    for (let i = 0; i < currentDay && i < dhorCycle.entries.length; i++) {
      seen.add(dhorCycle.entries[i].juz)
    }
    return seen.size
  }, [dhorCycle.entries, currentDay])

  const totalJuz = useMemo(() => {
    const seen = new Set<number>()
    for (const entry of dhorCycle.entries) {
      seen.add(entry.juz)
    }
    return seen.size
  }, [dhorCycle.entries])

  const c = buildColors(isDark)

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: c.text }]}>Revision Cycle</Text>
        <Text style={[styles.dayLabel, { color: c.amber }]}>
          Day {currentDay} of {dhorCycle.cycleLengthDays}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.barBg, { backgroundColor: c.barBg }]}>
        <View
          style={[
            styles.barFill,
            {
              backgroundColor: c.amber,
              width: `${Math.min(progress * 100, 100)}%`,
            },
          ]}
        />
      </View>

      {/* Juz quality segments */}
      <View style={styles.segmentsRow}>
        {juzSegments.map((seg, i) => (
          <View
            key={`${seg.juz}-${i}`}
            style={[
              styles.segmentDot,
              {
                backgroundColor: getQualityColor(
                  qualityScores[seg.juz] ?? 3.5,
                  isDark,
                ),
              },
            ]}
          />
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Text style={[styles.statsText, { color: c.muted }]}>
          {reviewedJuz} of {totalJuz} juz reviewed this cycle
        </Text>
        <Text style={[styles.statsText, { color: c.muted }]}>
          ~{remainingDays} days remaining
        </Text>
      </View>
    </View>
  )
}

function buildColors(isDark: boolean) {
  return {
    card: isDark ? '#1a1a1a' : '#fff',
    border: isDark ? '#2a2a2a' : '#e8e8e8',
    text: isDark ? '#fff' : '#1a1a1a',
    muted: isDark ? '#888' : '#777',
    amber: isDark ? '#fbbf24' : '#d97706',
    barBg: isDark ? '#333' : '#e8e8e8',
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  barBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  segmentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 10,
  },
  segmentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statsText: {
    fontSize: 12,
  },
})

/**
 * StatsPanel - Summary statistics displayed above the surah grid.
 *
 * Shows total memorized ayahs out of 6,236, percentage,
 * and strongest/weakest juz breakdown.
 */

import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useHifzStore } from '@/stores/hifzStore'
import { hifzService } from '@/services/hifzService'

const TOTAL_AYAHS = 6236

interface StatsPanelProps {
  isDark: boolean
}

function buildColors(isDark: boolean) {
  return {
    bg: isDark ? '#1e1e1e' : '#f5f5f5',
    text: isDark ? '#fff' : '#1a1a1a',
    muted: isDark ? '#888' : '#999',
    accent: isDark ? '#4ade80' : '#16a34a',
    border: isDark ? '#2a2a2a' : '#e8e8e8',
  }
}

export function StatsPanel({ isDark }: StatsPanelProps) {
  const totalMemorized = useHifzStore((s) => s.totalMemorized)
  const loaded = useHifzStore((s) => s.loaded)
  const colors = buildColors(isDark)

  const juzStats = useMemo(() => {
    if (!loaded) return null
    return hifzService.getJuzStats('hafs')
  }, [loaded])

  const percentage = TOTAL_AYAHS > 0 ? Math.round((totalMemorized / TOTAL_AYAHS) * 100) : 0

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={styles.mainStat}>
        <Text style={[styles.bigNumber, { color: colors.accent }]}>
          {totalMemorized.toLocaleString()}
        </Text>
        <Text style={[styles.ofTotal, { color: colors.muted }]}>
          {' / '}
          {TOTAL_AYAHS.toLocaleString()} ayahs ({percentage}%)
        </Text>
      </View>

      {juzStats?.strongest && juzStats?.weakest && (
        <View style={styles.juzRow}>
          <View style={styles.juzStat}>
            <Text style={[styles.juzLabel, { color: colors.muted }]}>Strongest</Text>
            <Text style={[styles.juzValue, { color: colors.text }]}>
              Juz {juzStats.strongest.juz} ({Math.round(juzStats.strongest.avgStrength * 100)}%)
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.juzStat}>
            <Text style={[styles.juzLabel, { color: colors.muted }]}>Weakest</Text>
            <Text style={[styles.juzValue, { color: colors.text }]}>
              Juz {juzStats.weakest.juz} ({Math.round(juzStats.weakest.avgStrength * 100)}%)
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  mainStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  bigNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  ofTotal: {
    fontSize: 14,
  },
  juzRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  juzStat: {
    flex: 1,
  },
  juzLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  juzValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 30,
    marginHorizontal: 12,
  },
})

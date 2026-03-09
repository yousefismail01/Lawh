/**
 * LevelTransition - Modal interstitial shown when student crosses levels.
 *
 * Compares old vs new LevelConfig and shows what changed.
 */

import React, { useMemo } from 'react'
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'
import { getLevelConfig } from '@/lib/algorithm'
import type { StudentLevel } from '@/lib/algorithm'

interface LevelTransitionProps {
  visible: boolean
  fromLevel: StudentLevel
  toLevel: StudentLevel
  onDismiss: () => void
}

interface DiffRow {
  label: string
  oldVal: string
  newVal: string
}

export function LevelTransition({
  visible,
  fromLevel,
  toLevel,
  onDismiss,
}: LevelTransitionProps) {
  const { isDark, textColor, cardColor, borderColor, secondaryTextColor, accentColor } =
    useResolvedTheme()

  const isLevelUp = toLevel > fromLevel

  const diffRows = useMemo(() => {
    const oldCfg = getLevelConfig(fromLevel)
    const newCfg = getLevelConfig(toLevel)
    const rows: DiffRow[] = []

    if (oldCfg.sabaqPagesPerDay !== newCfg.sabaqPagesPerDay) {
      rows.push({
        label: 'New memorization/day',
        oldVal: String(oldCfg.sabaqPagesPerDay),
        newVal: String(newCfg.sabaqPagesPerDay),
      })
    }
    if (oldCfg.dhorPagesPerDay !== newCfg.dhorPagesPerDay) {
      rows.push({
        label: 'Revision pages/day',
        oldVal: String(oldCfg.dhorPagesPerDay),
        newVal: String(newCfg.dhorPagesPerDay),
      })
    }
    if (oldCfg.dhorCycleDays !== newCfg.dhorCycleDays) {
      rows.push({
        label: 'Revision cycle',
        oldVal: `${oldCfg.dhorCycleDays} days`,
        newVal: `${newCfg.dhorCycleDays} days`,
      })
    }
    if (oldCfg.sabqiWindowJuz !== newCfg.sabqiWindowJuz) {
      rows.push({
        label: 'Review window',
        oldVal: `${oldCfg.sabqiWindowJuz} juz`,
        newVal: `${newCfg.sabqiWindowJuz} juz`,
      })
    }

    return rows
  }, [fromLevel, toLevel])

  const overlayBg = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)'
  const mutedColor = secondaryTextColor
  const starColor = '#FFD60A'

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={[styles.overlay, { backgroundColor: overlayBg }]}>
        <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
          {/* Star icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="star-outline" size={40} color={starColor} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: textColor }]}>
            {isLevelUp ? 'Level Up!' : 'Level Adjusted'}
          </Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: mutedColor }]}>
            Level {fromLevel} {'-->'} Level {toLevel}
          </Text>

          {/* Diff table */}
          {diffRows.length > 0 && (
            <View style={[styles.table, { borderColor }]}>
              {diffRows.map((row) => (
                <View
                  key={row.label}
                  style={[styles.tableRow, { borderBottomColor: borderColor }]}
                >
                  <Text style={[styles.tableLabel, { color: mutedColor }]}>
                    {row.label}
                  </Text>
                  <View style={styles.tableValues}>
                    <Text style={[styles.oldVal, { color: mutedColor }]}>
                      {row.oldVal}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={12}
                      color={mutedColor}
                      style={styles.arrow}
                    />
                    <Text style={[styles.newVal, { color: textColor }]}>
                      {row.newVal}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Explanation */}
          <Text style={[styles.explanation, { color: mutedColor }]}>
            As your memorization grows, the focus shifts from new memorization to
            revision. Your schedule has been adjusted automatically.
          </Text>

          {/* Dismiss button */}
          <Pressable
            style={[styles.button, { backgroundColor: accentColor }]}
            onPress={onDismiss}
          >
            <Text style={styles.buttonText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 20,
  },
  table: {
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableLabel: {
    fontSize: 13,
    flex: 1,
  },
  tableValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  oldVal: {
    fontSize: 13,
  },
  arrow: {
    marginHorizontal: 6,
  },
  newVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  explanation: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
})

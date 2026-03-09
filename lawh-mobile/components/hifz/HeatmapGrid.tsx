/**
 * HeatmapGrid - 30-column x 20-row SVG grid representing 604 mushaf pages.
 *
 * Each column is a juz (1-30), each row a page within that juz (1-20).
 * Cells are colored by quality score for memorized juz, gray for unmemorized.
 */

import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Rect } from 'react-native-svg'

interface HeatmapGridProps {
  memorizedJuz: number[]
  qualityScores: Record<number, number>
  isDark: boolean
}

const CELL_SIZE = 9
const GAP = 1
const COLS = 30
const ROWS = 20

const GRID_WIDTH = COLS * (CELL_SIZE + GAP)
const GRID_HEIGHT = ROWS * (CELL_SIZE + GAP)

function getQualityColor(quality: number, isDark: boolean): string {
  if (quality >= 4.0) return isDark ? '#30D158' : '#34C759'
  if (quality >= 3.0) return isDark ? '#FFD60A' : '#FFCC00'
  if (quality >= 2.0) return isDark ? '#FF9F0A' : '#FF9500'
  return isDark ? '#FF453A' : '#FF3B30'
}

const LEGEND_ITEMS = [
  { label: 'Strong', getColor: (d: boolean) => d ? '#30D158' : '#34C759' },
  { label: 'Good', getColor: (d: boolean) => d ? '#FFD60A' : '#FFCC00' },
  { label: 'Moderate', getColor: (d: boolean) => d ? '#FF9F0A' : '#FF9500' },
  { label: 'Weak', getColor: (d: boolean) => d ? '#FF453A' : '#FF3B30' },
  { label: 'Not memorized', getColor: (d: boolean) => d ? '#333' : '#ddd' },
]

export function HeatmapGrid({ memorizedJuz, qualityScores, isDark }: HeatmapGridProps) {
  const memorizedSet = useMemo(() => new Set(memorizedJuz), [memorizedJuz])
  const grayColor = isDark ? '#333' : '#ddd'

  const cells = useMemo(() => {
    const result: React.ReactElement[] = []
    for (let col = 0; col < COLS; col++) {
      const juz = col + 1
      const isMemorized = memorizedSet.has(juz)
      const quality = qualityScores[juz] ?? 0
      const fill = isMemorized ? getQualityColor(quality, isDark) : grayColor

      for (let row = 0; row < ROWS; row++) {
        result.push(
          <Rect
            key={`${col}-${row}`}
            x={col * (CELL_SIZE + GAP)}
            y={row * (CELL_SIZE + GAP)}
            width={CELL_SIZE}
            height={CELL_SIZE}
            fill={fill}
            rx={1.5}
          />,
        )
      }
    }
    return result
  }, [memorizedSet, qualityScores, isDark, grayColor])

  const textColor = isDark ? '#fff' : '#1a1a1a'
  const mutedColor = isDark ? '#888' : '#999'
  const cardBg = isDark ? '#1a1a1a' : '#fff'
  const borderColor = isDark ? '#2a2a2a' : '#e8e8e8'

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <Text style={[styles.title, { color: textColor }]}>Mushaf Heatmap</Text>

      <View style={styles.gridContainer}>
        <Svg width={GRID_WIDTH} height={GRID_HEIGHT}>
          {cells}
        </Svg>
      </View>

      {/* Juz labels */}
      <View style={styles.juzLabelRow}>
        <Text style={[styles.juzLabel, { color: mutedColor }]}>1</Text>
        <Text style={[styles.juzLabel, { color: mutedColor }]}>30</Text>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        {LEGEND_ITEMS.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View
              style={[styles.legendSwatch, { backgroundColor: item.getColor(isDark) }]}
            />
            <Text style={[styles.legendText, { color: mutedColor }]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  gridContainer: {
    alignItems: 'center',
  },
  juzLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  juzLabel: {
    fontSize: 10,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendSwatch: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
  },
})

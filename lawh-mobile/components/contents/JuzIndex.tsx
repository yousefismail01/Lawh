import React, { useCallback, useRef } from 'react'
import { View, Text, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native'

interface JuzIndexProps {
  onSelectJuz: (juz: number) => void
  totalJuz?: number
}

function JuzIndexInner({ onSelectJuz, totalJuz = 30 }: JuzIndexProps) {
  const numbers = Array.from({ length: totalJuz }, (_, i) => i + 1)
  const containerHeight = useRef(0)
  const lastJuz = useRef(0)

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    containerHeight.current = e.nativeEvent.layout.height
  }, [])

  const juzFromY = useCallback((y: number) => {
    const h = containerHeight.current
    if (h <= 0) return 1
    const clamped = Math.max(0, Math.min(y, h))
    return Math.min(totalJuz, Math.max(1, Math.ceil((clamped / h) * totalJuz)))
  }, [totalJuz])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const juz = juzFromY(evt.nativeEvent.locationY)
        lastJuz.current = juz
        onSelectJuz(juz)
      },
      onPanResponderMove: (evt) => {
        const juz = juzFromY(evt.nativeEvent.locationY)
        if (juz !== lastJuz.current) {
          lastJuz.current = juz
          onSelectJuz(juz)
        }
      },
    })
  ).current

  return (
    <View
      style={styles.container}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      {numbers.map((juz) => (
        <View key={juz} style={styles.item}>
          <Text style={styles.number}>{juz}</Text>
        </View>
      ))}
    </View>
  )
}

export const JuzIndex = React.memo(JuzIndexInner)

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 4,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 14,
  },
  number: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },
})

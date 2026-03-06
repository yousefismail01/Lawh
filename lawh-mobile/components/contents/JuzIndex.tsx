import React, { useCallback, useEffect } from 'react'
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'

interface JuzIndexColors {
  bg: string
  text: string
  border: string
}

interface JuzIndexProps {
  onSelectJuz: (juz: number, animated: boolean) => void
  visibleJuz?: number
  totalJuz?: number
  colors?: JuzIndexColors
}

function JuzIndexInner({ onSelectJuz, visibleJuz = 0, totalJuz = 30, colors }: JuzIndexProps) {
  const bg = colors?.bg ?? 'rgba(255, 255, 255, 0.9)'
  const textColor = colors?.text ?? '#333'
  const borderClr = colors?.border ?? '#ddd'

  const numbers = Array.from({ length: totalJuz }, (_, i) => i + 1)
  const containerHeight = useSharedValue(0)
  const lastJuz = useSharedValue(0)
  const activeJuz = useSharedValue(0)
  const isDragging = useSharedValue(false)
  const scrollJuz = useSharedValue(visibleJuz)

  useEffect(() => {
    scrollJuz.value = visibleJuz
  }, [visibleJuz])

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    containerHeight.value = e.nativeEvent.layout.height
  }, [])

  const selectJuz = useCallback(
    (juz: number, animated: boolean) => {
      onSelectJuz(juz, animated)
    },
    [onSelectJuz]
  )

  const juzFromY = (y: number, h: number): number => {
    'worklet'
    if (h <= 0) return 1
    const clamped = Math.max(0, Math.min(y, h))
    return Math.min(totalJuz, Math.max(1, Math.ceil((clamped / h) * totalJuz)))
  }

  const pan = Gesture.Pan()
    .onBegin((e) => {
      'worklet'
      isDragging.value = true
      const juz = juzFromY(e.y, containerHeight.value)
      lastJuz.value = juz
      activeJuz.value = juz
      runOnJS(selectJuz)(juz, false)
    })
    .onUpdate((e) => {
      'worklet'
      const juz = juzFromY(e.y, containerHeight.value)
      activeJuz.value = juz
      if (juz !== lastJuz.value) {
        lastJuz.value = juz
        runOnJS(selectJuz)(juz, false)
      }
    })
    .onEnd(() => {
      'worklet'
      isDragging.value = false
      activeJuz.value = 0
    })
    .onFinalize(() => {
      'worklet'
      isDragging.value = false
      activeJuz.value = 0
    })
    .hitSlop({ left: 10, right: 10, top: 5, bottom: 5 })
    .shouldCancelWhenOutside(false)
    .minDistance(0)

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <GestureDetector gesture={pan}>
        <View style={[styles.container, { backgroundColor: bg, borderLeftColor: borderClr }]} onLayout={handleLayout}>
          {numbers.map((juz) => (
            <JuzNumber
              key={juz}
              juz={juz}
              activeJuz={activeJuz}
              scrollJuz={scrollJuz}
              isDragging={isDragging}
              textColor={textColor}
            />
          ))}
        </View>
      </GestureDetector>
    </View>
  )
}

/** Individual juz number that enlarges when active (drag or scroll) */
const JuzNumber = React.memo(function JuzNumber({
  juz,
  activeJuz,
  scrollJuz,
  isDragging,
  textColor,
}: {
  juz: number
  activeJuz: Animated.SharedValue<number>
  scrollJuz: Animated.SharedValue<number>
  isDragging: Animated.SharedValue<boolean>
  textColor?: string
}) {
  const animStyle = useAnimatedStyle(() => {
    const highlighted = isDragging.value
      ? activeJuz.value === juz
      : scrollJuz.value === juz
    return {
      transform: [{ scale: withTiming(highlighted ? 1.5 : 1, { duration: 80 }) }],
      opacity: withTiming(highlighted ? 1 : 0.55, { duration: 80 }),
    }
  })

  return (
    <Animated.View style={[styles.item, animStyle]}>
      <Text style={[styles.number, { color: textColor ?? '#333' }]}>{juz}</Text>
    </Animated.View>
  )
})

export const JuzIndex = React.memo(JuzIndexInner)

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  container: {
    width: 24,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    alignItems: 'center',
    paddingVertical: 4,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 1,
  },
  number: {
    fontSize: 8,
    fontWeight: '500',
  },
})

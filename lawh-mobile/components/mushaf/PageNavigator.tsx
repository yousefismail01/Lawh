import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
  Animated,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native'
// Use Text-based icon to avoid @expo/vector-icons resolution issues

const TOTAL_PAGES = 604
const AUTO_HIDE_DELAY = 3000

interface PageNavigatorProps {
  currentPage: number
  onPageChange: (page: number) => void
  onOpenSurahList: () => void
}

export const PageNavigator = React.memo(function PageNavigator({
  currentPage,
  onPageChange,
  onOpenSurahList,
}: PageNavigatorProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [visible, setVisible] = useState(true)
  const opacity = useRef(new Animated.Value(1)).current
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sliderWidth = useRef(0)

  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setVisible(true)
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start()
    hideTimer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setVisible(false)
      })
    }, AUTO_HIDE_DELAY)
  }, [opacity])

  useEffect(() => {
    resetHideTimer()
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [currentPage, resetHideTimer])

  const handleTap = useCallback(() => {
    if (!visible) {
      setVisible(true)
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start()
    }
    resetHideTimer()
  }, [visible, opacity, resetHideTimer])

  const handleSliderLayout = useCallback((e: LayoutChangeEvent) => {
    sliderWidth.current = e.nativeEvent.layout.width
  }, [])

  // RTL slider: max (page 1) on the right, min (page 604) on the left
  // So position = (TOTAL_PAGES - currentPage) / (TOTAL_PAGES - 1) gives left-to-right fraction
  const sliderFraction = (TOTAL_PAGES - currentPage) / (TOTAL_PAGES - 1)

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        resetHideTimer()
        const x = evt.nativeEvent.locationX
        const fraction = x / (sliderWidth.current || 1)
        // RTL: left = 604, right = 1
        const page = Math.round(TOTAL_PAGES - fraction * (TOTAL_PAGES - 1))
        const clamped = Math.max(1, Math.min(TOTAL_PAGES, page))
        onPageChange(clamped)
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX
        const fraction = x / (sliderWidth.current || 1)
        const page = Math.round(TOTAL_PAGES - fraction * (TOTAL_PAGES - 1))
        const clamped = Math.max(1, Math.min(TOTAL_PAGES, page))
        onPageChange(clamped)
      },
    })
  ).current

  const bgColor = isDark ? 'rgba(28, 24, 18, 0.92)' : 'rgba(250, 243, 224, 0.92)'
  const trackColor = isDark ? '#3a3225' : '#d4c8a8'
  const thumbColor = isDark ? '#8a7340' : '#c9a84c'
  const textColor = isDark ? '#e8e0d0' : '#1a1a1a'
  const iconColor = isDark ? '#a09880' : '#6b5c3a'

  return (
    <Pressable onPress={handleTap} style={styles.touchArea}>
      <Animated.View style={[styles.container, { backgroundColor: bgColor, opacity }]}>
        <Pressable onPress={onOpenSurahList} style={styles.iconButton} hitSlop={12}>
          <Text style={{ fontSize: 16, color: iconColor, fontWeight: '700' }}>&#x2630;</Text>
        </Pressable>

        <View
          style={[styles.sliderTrack, { backgroundColor: trackColor }]}
          onLayout={handleSliderLayout}
          {...panResponder.panHandlers}
        >
          <View
            style={[
              styles.sliderThumb,
              {
                backgroundColor: thumbColor,
                left: `${sliderFraction * 100}%`,
              },
            ]}
          />
        </View>

        <Text style={[styles.pageNumber, { color: textColor }]}>{currentPage}</Text>
      </Animated.View>
    </Pressable>
  )
})

const styles = StyleSheet.create({
  touchArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 30,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  iconButton: {
    padding: 4,
    marginRight: 10,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    justifyContent: 'center',
  },
  sliderThumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
  },
  pageNumber: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
})

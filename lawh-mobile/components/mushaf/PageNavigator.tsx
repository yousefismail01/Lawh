import React, { useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native'

const TOTAL_PAGES = 604

interface PageNavigatorProps {
  currentPage: number
  onPageChange: (page: number) => void
}

export const PageNavigator = React.memo(function PageNavigator({
  currentPage,
  onPageChange,
}: PageNavigatorProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const sliderWidth = useRef(0)

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

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
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
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    marginHorizontal: 8,
    borderRadius: 12,
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

import React from 'react'
import { View, Text, StyleSheet, useColorScheme } from 'react-native'

interface AyahMarkerProps {
  number: number
}

export const AyahMarker = React.memo(function AyahMarker({ number }: AyahMarkerProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const outerBorderColor = isDark ? '#6a9a6a' : '#4a8a4a'
  const innerBorderColor = isDark ? '#8aba8a' : '#6aab6a'
  const bgColor = isDark ? '#2a3a2a' : '#f0f8f0'
  const numColor = isDark ? '#8aba8a' : '#2a6a2a'

  return (
    <View style={[styles.outer, { borderColor: outerBorderColor }]}>
      <View style={[styles.middle, { borderColor: innerBorderColor }]}>
        <View style={[styles.inner, { backgroundColor: bgColor }]}>
          <Text style={[styles.number, { color: numColor }]}>{number}</Text>
        </View>
      </View>
    </View>
  )
})

const MARKER_SIZE = 26

const styles = StyleSheet.create({
  outer: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1,
  },
  middle: {
    width: MARKER_SIZE - 4,
    height: MARKER_SIZE - 4,
    borderRadius: (MARKER_SIZE - 4) / 2,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: MARKER_SIZE - 7,
    height: MARKER_SIZE - 7,
    borderRadius: (MARKER_SIZE - 7) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
})

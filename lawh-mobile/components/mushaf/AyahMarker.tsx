import React from 'react'
import { View, Text, StyleSheet, useColorScheme } from 'react-native'

interface AyahMarkerProps {
  number: string
}

export const AyahMarker = React.memo(function AyahMarker({ number }: AyahMarkerProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.number, isDark && styles.numberDark]}>{number}</Text>
    </View>
  )
})

const MARKER_SIZE = 22

const styles = StyleSheet.create({
  container: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 1.5,
    borderColor: '#c9a84c',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  containerDark: {
    borderColor: '#8a7340',
  },
  number: {
    fontFamily: 'KFGQPCHafs',
    fontSize: 10,
    color: '#c9a84c',
    textAlign: 'center',
    includeFontPadding: false,
  },
  numberDark: {
    color: '#8a7340',
  },
})

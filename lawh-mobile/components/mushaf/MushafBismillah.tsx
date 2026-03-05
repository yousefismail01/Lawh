import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface MushafBismillahProps {
  surahId: number
}

export const MushafBismillah = React.memo(function MushafBismillah(_props: MushafBismillahProps) {
  return (
    <View style={styles.container}>
      <Text
        style={styles.bismillah}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        bismillah
      </Text>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  bismillah: {
    fontFamily: 'QuranCommon',
    fontSize: 40,
    color: '#000',
    textAlign: 'center',
    includeFontPadding: false,
  },
})

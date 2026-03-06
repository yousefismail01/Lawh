import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface MushafPageHeaderProps {
  surahNameSimple: string
  juz: number
  textColor?: string
  separatorColor?: string
}

export const MushafPageHeader = React.memo(function MushafPageHeader({
  surahNameSimple,
  juz,
  textColor,
  separatorColor,
}: MushafPageHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={[styles.text, textColor ? { color: textColor } : undefined]}>{surahNameSimple}</Text>
        <Text style={[styles.text, textColor ? { color: textColor } : undefined]}>Part {juz}</Text>
      </View>
      <View style={[styles.separator, separatorColor ? { backgroundColor: separatorColor } : undefined]} />
    </View>
  )
})

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: 2,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
    paddingHorizontal: 8,
  },
  text: {
    fontSize: 11,
    fontWeight: '400',
    color: '#666',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#e0e0e0',
  },
})

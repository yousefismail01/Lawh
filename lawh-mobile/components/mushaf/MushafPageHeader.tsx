import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface MushafPageHeaderProps {
  surahNameSimple: string
  juz: number
  pageNumber: number
}

export const MushafPageHeader = React.memo(function MushafPageHeader({
  surahNameSimple,
  juz,
  pageNumber,
}: MushafPageHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.text}>{surahNameSimple}</Text>
        <Text style={styles.text}>{pageNumber}</Text>
        <Text style={styles.text}>Part {juz}</Text>
      </View>
      <View style={styles.separator} />
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
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#e0e0e0',
  },
})

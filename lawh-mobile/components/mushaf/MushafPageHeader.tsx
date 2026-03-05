import React from 'react'
import { View, Text, StyleSheet, useColorScheme } from 'react-native'

interface MushafPageHeaderProps {
  surahName: string
  juz: number
  pageNumber: number
}

export const MushafPageHeader = React.memo(function MushafPageHeader({
  surahName,
  juz,
  pageNumber,
}: MushafPageHeaderProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const textColor = isDark ? '#a09880' : '#8a7a60'
  const separatorColor = isDark ? '#3a3020' : '#d4c5a0'

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.text, styles.side, { color: textColor }]}>
          {'\u0627\u0644\u062C\u0632\u0621 {juz}'.replace('{juz}', String(juz))}
        </Text>
        <Text style={[styles.text, styles.center, { color: textColor }]}>
          {pageNumber}
        </Text>
        <Text style={[styles.text, styles.side, { color: textColor, writingDirection: 'rtl' }]}>
          {surahName}
        </Text>
      </View>
      <View style={[styles.separator, { backgroundColor: separatorColor }]} />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontFamily: 'KFGQPCHafs',
    includeFontPadding: false,
  },
  side: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
})

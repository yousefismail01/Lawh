import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface JuzSectionHeaderColors {
  bg: string
  text: string
  line: string
}

interface JuzSectionHeaderProps {
  title: string
  colors?: JuzSectionHeaderColors
}

function JuzSectionHeaderInner({ title, colors }: JuzSectionHeaderProps) {
  const bg = colors?.bg ?? '#f8f8f8'
  const text = colors?.text ?? '#666'
  const line = colors?.line ?? '#ddd'

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.line, { backgroundColor: line }]} />
      <Text style={[styles.text, { color: text }]}>{title}</Text>
      <View style={[styles.line, { backgroundColor: line }]} />
    </View>
  )
}

export const JuzSectionHeader = React.memo(JuzSectionHeaderInner)

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 31,
    paddingHorizontal: 16,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginHorizontal: 12,
    textTransform: 'uppercase',
  },
})

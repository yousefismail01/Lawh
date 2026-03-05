import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface JuzSectionHeaderProps {
  title: string
}

function JuzSectionHeaderInner({ title }: JuzSectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>{title}</Text>
      <View style={styles.line} />
    </View>
  )
}

export const JuzSectionHeader = React.memo(JuzSectionHeaderInner)

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f5edd5',
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c4b48a',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#6b5c3a',
    marginHorizontal: 12,
    textTransform: 'uppercase',
  },
})

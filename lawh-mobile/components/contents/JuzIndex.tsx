import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'

interface JuzIndexProps {
  onSelectJuz: (juz: number) => void
  totalJuz?: number
}

function JuzIndexInner({ onSelectJuz, totalJuz = 30 }: JuzIndexProps) {
  const numbers = Array.from({ length: totalJuz }, (_, i) => i + 1)

  return (
    <View style={styles.container}>
      {numbers.map((juz) => (
        <Pressable
          key={juz}
          style={styles.item}
          onPress={() => onSelectJuz(juz)}
          hitSlop={{ top: 2, bottom: 2, left: 8, right: 8 }}
        >
          <Text style={styles.number}>{juz}</Text>
        </Pressable>
      ))}
    </View>
  )
}

export const JuzIndex = React.memo(JuzIndexInner)

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 4,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 14,
  },
  number: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },
})

import React from 'react'
import { View, StyleSheet } from 'react-native'
import type { ReactNode } from 'react'

interface MushafFrameProps {
  children: ReactNode
  isSpecialPage?: boolean
  backgroundColor?: string
}

export const MushafFrame = React.memo(function MushafFrame({ children, isSpecialPage = false, backgroundColor }: MushafFrameProps) {
  return (
    <View style={[styles.frame, backgroundColor ? { backgroundColor } : undefined]}>
      {children}
    </View>
  )
})

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
})

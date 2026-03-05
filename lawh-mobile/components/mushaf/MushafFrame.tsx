import React from 'react'
import { View, StyleSheet, useColorScheme } from 'react-native'
import type { ReactNode } from 'react'

interface MushafFrameProps {
  children: ReactNode
  isSpecialPage?: boolean
}

export const MushafFrame = React.memo(function MushafFrame({ children, isSpecialPage = false }: MushafFrameProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const outerBorderColor = isDark ? '#6b5c3a' : '#c9a84c'
  const innerBorderColor = isDark ? '#3a3020' : '#e8d5a3'
  const backgroundColor = isDark ? '#1c1812' : '#faf3e0'

  return (
    <View
      style={[
        styles.outerFrame,
        {
          borderColor: outerBorderColor,
          borderWidth: isSpecialPage ? 2.5 : 1.5,
        },
      ]}
    >
      <View
        style={[
          styles.innerFrame,
          {
            borderColor: innerBorderColor,
            backgroundColor,
            padding: isSpecialPage ? 16 : 10,
          },
        ]}
      >
        {children}
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  outerFrame: {
    borderRadius: 6,
    margin: 4,
    flex: 1,
  },
  innerFrame: {
    borderWidth: 1,
    borderRadius: 4,
    flex: 1,
  },
})

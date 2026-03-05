import React, { useCallback, useState } from 'react'
import {
  Pressable,
  Text,
  StyleSheet,
  useColorScheme,
  type ViewStyle,
  type StyleProp,
} from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

interface MicPlaceholderButtonProps {
  style?: StyleProp<ViewStyle>
}

export const MicPlaceholderButton = React.memo(function MicPlaceholderButton({
  style,
}: MicPlaceholderButtonProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [toastVisible, setToastVisible] = useState(false)

  const handlePress = useCallback(() => {
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2000)
  }, [])

  const bgColor = isDark ? '#d4b45c' : '#c8a84e'

  return (
    <>
      <Pressable
        onPress={handlePress}
        style={[styles.button, { backgroundColor: bgColor }, style]}
        accessibilityLabel="Start recitation"
        accessibilityRole="button"
      >
        <Text style={styles.icon}>{'\uD83C\uDFA4'}</Text>
      </Pressable>

      {toastVisible && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(300)}
          style={[
            styles.toast,
            {
              backgroundColor: isDark
                ? 'rgba(40, 35, 25, 0.95)'
                : 'rgba(60, 50, 30, 0.9)',
            },
          ]}
        >
          <Text style={styles.toastText}>Recitation coming soon</Text>
        </Animated.View>
      )}
    </>
  )
})

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
  toast: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 180,
    alignItems: 'center',
  },
  toastText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
})

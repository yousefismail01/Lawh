import React from 'react'
import { Pressable, StyleSheet, Text, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

/**
 * Overlay icons for chrome-visible state in the Mushaf screen.
 * Renders hamburger (back to hub) and glossary (contents) icons,
 * positioned absolutely at top-left over the MushafPageHeader area.
 * Uses fade animation for enter/exit.
 */
export const ChromeOverlay = React.memo(function ChromeOverlay() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const iconColor = isDark ? '#a09880' : '#6b5c3a'
  const pillBg = isDark ? 'rgba(28, 24, 18, 0.75)' : 'rgba(250, 243, 224, 0.8)'

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(300)}
      style={[styles.container, { top: insets.top + 4 }]}
      pointerEvents="box-none"
    >
      <Animated.View style={[styles.pill, { backgroundColor: pillBg }]}>
        <Pressable
          onPress={() => router.push('/(main)/hub')}
          hitSlop={12}
          style={styles.iconButton}
        >
          <Text style={[styles.iconText, { color: iconColor }]}>{'\u2630'}</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(main)/contents')}
          hitSlop={12}
          style={styles.iconButton}
        >
          <Text style={[styles.iconText, { color: iconColor }]}>{'\u2263'}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 8,
    zIndex: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
    lineHeight: 24,
  },
})

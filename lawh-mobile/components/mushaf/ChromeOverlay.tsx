import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { MushafPageHeader } from './MushafPageHeader'

interface ChromeOverlayProps {
  surahName: string
  pageNumber: number
  juz: number
  hizb: number
  quarter: number
  chromeVisible: boolean
}

/**
 * Always-visible header with surah info.
 * When chromeVisible, adds ≡ menu + bookmark + settings icons.
 */
export const ChromeOverlay = React.memo(function ChromeOverlay({
  surahName,
  pageNumber,
  juz,
  hizb,
  quarter,
  chromeVisible,
}: ChromeOverlayProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  return (
    <View
      style={[styles.container, { paddingTop: insets.top }]}
      pointerEvents="box-none"
    >
      {/* Chrome-only icons row */}
      {chromeVisible && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(300)}
          style={styles.iconsRow}
        >
          <Pressable
            onPress={() => router.push('/(main)/hub')}
            hitSlop={12}
            style={styles.iconButton}
          >
            <Text style={styles.menuIcon}>{'\u2630'}</Text>
          </Pressable>

          <View style={styles.iconsSpacer} />

          <Pressable
            onPress={() => router.push('/(main)/contents')}
            hitSlop={12}
            style={styles.iconButton}
          >
            <Text style={styles.icon}>{'\uD83D\uDD16'}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(main)/settings')}
            hitSlop={12}
            style={styles.iconButton}
          >
            <Text style={styles.icon}>{'\u2699'}</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Always-visible surah info */}
      <MushafPageHeader
        surahNameSimple={surahName}
        juz={juz}
        hizb={hizb}
        quarter={quarter}
        pageNumber={pageNumber}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 2,
  },
  iconsSpacer: {
    flex: 1,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
  },
  menuIcon: {
    fontSize: 22,
    color: '#333',
  },
  icon: {
    fontSize: 18,
    color: '#333',
  },
})

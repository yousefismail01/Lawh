import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

interface ChromeOverlayProps {
  surahName: string
  pageNumber: number
  juz: number
  hizb: number
}

/**
 * Chrome header overlay: ≡ menu | surah info pill | bookmark + settings icons.
 * Appears on tap, fades in/out with the chrome toggle.
 */
export const ChromeOverlay = React.memo(function ChromeOverlay({
  surahName,
  pageNumber,
  juz,
  hizb,
}: ChromeOverlayProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(300)}
      style={[styles.container, { paddingTop: insets.top + 4 }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar}>
        {/* Menu icon */}
        <Pressable
          onPress={() => router.push('/(main)/hub')}
          hitSlop={12}
          style={styles.iconButton}
        >
          <Text style={styles.menuIcon}>{'\u2630'}</Text>
        </Pressable>

        {/* Surah info pill */}
        <Pressable
          onPress={() => router.push('/(main)/contents')}
          style={styles.infoPill}
        >
          <Text style={styles.surahName}>{surahName}</Text>
          <Text style={styles.pageInfo}>
            Page {pageNumber} | Juz {juz} | Hizb {hizb}
          </Text>
        </Pressable>

        {/* Right icons */}
        <View style={styles.rightIcons}>
          <Pressable hitSlop={12} style={styles.iconButton}>
            <Text style={styles.icon}>{'\uD83D\uDD16'}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(main)/settings')}
            hitSlop={12}
            style={styles.iconButton}
          >
            <Text style={styles.icon}>{'\u2699'}</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 10,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  menuIcon: {
    fontSize: 22,
    color: '#333',
  },
  infoPill: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  surahName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  pageInfo: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    fontSize: 18,
    color: '#333',
  },
})

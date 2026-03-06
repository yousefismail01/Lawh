import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

import { PageNavigator } from './PageNavigator'
import { MicPlaceholderButton } from './MicPlaceholderButton'
import { LayoutSelectorPopover } from './LayoutSelectorPopover'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'

interface MushafFooterProps {
  currentPage: number
  onPageChange: (page: number) => void
  onLayoutPress: () => void
  onPopoverOpen?: () => void
  onPopoverClose?: () => void
}

export const MushafFooter = React.memo(function MushafFooter({
  currentPage,
  onPageChange,
  onLayoutPress: _onLayoutPress,
  onPopoverOpen,
  onPopoverClose,
}: MushafFooterProps) {
  const { isDark } = useResolvedTheme()
  const insets = useSafeAreaInsets()
  const [popoverVisible, setPopoverVisible] = useState(false)

  const handleOpenPopover = useCallback(() => {
    setPopoverVisible(true)
    onPopoverOpen?.()
  }, [onPopoverOpen])

  const handleClosePopover = useCallback(() => {
    setPopoverVisible(false)
    onPopoverClose?.()
  }, [onPopoverClose])

  const textColor = isDark ? '#e8e0d0' : '#1a1a1a'
  const layoutIconColor = isDark ? '#c8a84e' : '#6b5c3e'
  const borderColor = isDark ? 'rgba(200, 168, 78, 0.15)' : 'rgba(0, 0, 0, 0.08)'

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(300)}
      style={styles.wrapper}
    >
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.container, { paddingBottom: insets.bottom }]}
      >
        {/* Top row: layout icon | page number | mic button */}
        <View style={[styles.topRow, { borderBottomColor: borderColor }]}>
          <Pressable
            onPress={handleOpenPopover}
            style={styles.layoutButton}
            accessibilityLabel="Reading layout"
            accessibilityRole="button"
          >
            <Text style={[styles.layoutIcon, { color: layoutIconColor }]}>
              {'\u2630'}
            </Text>
          </Pressable>

          <Text style={[styles.pageNumber, { color: textColor }]}>
            {currentPage}
          </Text>

          <View style={styles.micContainer}>
            <MicPlaceholderButton />
          </View>
        </View>

        {/* Bottom row: page slider */}
        <PageNavigator currentPage={currentPage} onPageChange={onPageChange} />
      </BlurView>

      <LayoutSelectorPopover
        visible={popoverVisible}
        onClose={handleClosePopover}
      />
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  layoutButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layoutIcon: {
    fontSize: 22,
  },
  pageNumber: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  micContainer: {
    position: 'relative',
  },
})

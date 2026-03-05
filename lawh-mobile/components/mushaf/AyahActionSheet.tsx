import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useColorScheme,
  Alert,
} from 'react-native'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'

interface AyahActionSheetProps {
  visible: boolean
  ayahInfo: { surahId: number; ayahNumber: number; textUthmani: string } | null
  onClose: () => void
}

export const AyahActionSheet = React.memo(function AyahActionSheet({
  visible,
  ayahInfo,
  onClose,
}: AyahActionSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null)
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const snapPoints = useMemo(() => ['30%'], [])

  useEffect(() => {
    if (visible && ayahInfo) {
      bottomSheetRef.current?.snapToIndex(0)
    } else {
      bottomSheetRef.current?.close()
    }
  }, [visible, ayahInfo])

  const handleBookmark = useCallback(() => {
    Alert.alert('Bookmark', 'Bookmark saved')
    onClose()
  }, [onClose])

  const handleTranslation = useCallback(() => {
    Alert.alert('Translation', 'Translation coming soon')
    onClose()
  }, [onClose])

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
    ),
    []
  )

  const bgColor = isDark ? '#1c1812' : '#faf3e0'
  const textColor = isDark ? '#e8e0d0' : '#1a1a1a'
  const secondaryColor = isDark ? '#a09880' : '#6b5c3a'
  const borderColor = isDark ? '#3a3225' : '#d4c8a8'
  const buttonBg = isDark ? '#2a241c' : '#f0e8d4'

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: bgColor }}
      handleIndicatorStyle={{ backgroundColor: secondaryColor }}
    >
      <View style={styles.content}>
        {ayahInfo?.textUthmani ? (
          <Text
            style={[styles.ayahText, { color: textColor }]}
            numberOfLines={3}
          >
            {ayahInfo.textUthmani}
          </Text>
        ) : null}

        <Text style={[styles.reference, { color: secondaryColor }]}>
          {ayahInfo ? `${ayahInfo.surahId}:${ayahInfo.ayahNumber}` : ''}
        </Text>

        <View style={[styles.divider, { backgroundColor: borderColor }]} />

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: buttonBg },
              pressed && { opacity: 0.6 },
            ]}
            onPress={handleBookmark}
          >
            <Text style={[styles.actionIcon, { color: secondaryColor }]}>&#x2606;</Text>
            <Text style={[styles.actionLabel, { color: textColor }]}>Bookmark</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: buttonBg },
              pressed && { opacity: 0.6 },
            ]}
            onPress={handleTranslation}
          >
            <Text style={[styles.actionIcon, { color: secondaryColor }]}>&#x29C9;</Text>
            <Text style={[styles.actionLabel, { color: textColor }]}>Translation</Text>
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  )
})

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
  },
  ayahText: {
    fontFamily: 'KFGQPCHafs',
    fontSize: 22,
    lineHeight: 40,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  reference: {
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
})

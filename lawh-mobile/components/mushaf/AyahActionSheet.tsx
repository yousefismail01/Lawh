import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useColorScheme,
  Alert,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { tafsirService } from '@/services/tafsirService'
import { translationService } from '@/services/translationService'

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
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const [loadingTafsir, setLoadingTafsir] = useState(false)
  const [loadingTranslation, setLoadingTranslation] = useState(false)
  const [tafsirText, setTafsirText] = useState<string | null>(null)
  const [translationText, setTranslationText] = useState<string | null>(null)

  const handleBookmark = useCallback(() => {
    Alert.alert('Bookmark', 'Bookmark saved')
    onClose()
  }, [onClose])

  const handleTafsir = useCallback(async () => {
    if (!ayahInfo) return
    if (tafsirText) {
      setTafsirText(null)
      return
    }
    setLoadingTafsir(true)
    try {
      const entry = await tafsirService.getTafsir(ayahInfo.surahId, ayahInfo.ayahNumber)
      setTafsirText(entry.text)
    } catch {
      Alert.alert('Error', 'Failed to load tafsir')
    } finally {
      setLoadingTafsir(false)
    }
  }, [ayahInfo, tafsirText])

  const handleTranslation = useCallback(async () => {
    if (!ayahInfo) return
    if (translationText) {
      setTranslationText(null)
      return
    }
    setLoadingTranslation(true)
    try {
      const entry = await translationService.getTranslation(ayahInfo.surahId, ayahInfo.ayahNumber)
      setTranslationText(entry.text)
    } catch {
      Alert.alert('Error', 'Failed to load translation')
    } finally {
      setLoadingTranslation(false)
    }
  }, [ayahInfo, translationText])

  const handleClose = useCallback(() => {
    setTafsirText(null)
    setTranslationText(null)
    onClose()
  }, [onClose])

  const bgColor = isDark ? '#1c1812' : '#faf3e0'
  const textColor = isDark ? '#e8e0d0' : '#1a1a1a'
  const secondaryColor = isDark ? '#a09880' : '#6b5c3a'
  const borderColor = isDark ? '#3a3225' : '#d4c8a8'
  const buttonBg = isDark ? '#2a241c' : '#f0e8d4'

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={[styles.sheet, { backgroundColor: bgColor }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: secondaryColor }]} />

          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.content}>
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
                disabled={loadingTranslation}
              >
                {loadingTranslation ? (
                  <ActivityIndicator size="small" color={secondaryColor} />
                ) : (
                  <Text style={[styles.actionIcon, { color: secondaryColor }]}>&#x29C9;</Text>
                )}
                <Text style={[styles.actionLabel, { color: textColor }]}>Translation</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: buttonBg },
                  pressed && { opacity: 0.6 },
                ]}
                onPress={handleTafsir}
                disabled={loadingTafsir}
              >
                {loadingTafsir ? (
                  <ActivityIndicator size="small" color={secondaryColor} />
                ) : (
                  <Text style={[styles.actionIcon, { color: secondaryColor }]}>&#x1F4D6;</Text>
                )}
                <Text style={[styles.actionLabel, { color: textColor }]}>Tafsir</Text>
              </Pressable>
            </View>

            {translationText ? (
              <View style={[styles.expandedSection, { borderColor }]}>
                <Text style={[styles.expandedLabel, { color: secondaryColor }]}>Translation</Text>
                <Text style={[styles.expandedText, { color: textColor }]}>{translationText}</Text>
              </View>
            ) : null}

            {tafsirText ? (
              <View style={[styles.expandedSection, { borderColor }]}>
                <Text style={[styles.expandedLabel, { color: secondaryColor }]}>Tafsir</Text>
                <Text style={[styles.expandedText, { color: textColor }]}>{tafsirText}</Text>
              </View>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
})

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34, // safe area
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  scrollContent: {
    flexGrow: 0,
  },
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
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
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
  expandedSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  expandedLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  expandedText: {
    fontSize: 15,
    lineHeight: 24,
  },
})

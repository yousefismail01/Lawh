import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  ScrollView,
  Share,
  Clipboard,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { tafsirService } from '@/services/tafsirService'
import { translationService } from '@/services/translationService'
import { chapters } from '@/lib/data/mushafData'
import { AyahAudioPlayer } from './AyahAudioPlayer'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'
import { useHifzStore } from '@/stores/hifzStore'
import { hifzService } from '@/services/hifzService'
import type { HifzStatus } from '@/lib/sr/types'

interface AyahActionSheetProps {
  visible: boolean
  ayahInfo: { surahId: number; ayahNumber: number } | null
  onClose: () => void
}

export const AyahActionSheet = React.memo(function AyahActionSheet({
  visible,
  ayahInfo,
  onClose,
}: AyahActionSheetProps) {
  const { isDark } = useResolvedTheme()
  const insets = useSafeAreaInsets()

  const [loadingTafsir, setLoadingTafsir] = useState(false)
  const [loadingTranslation, setLoadingTranslation] = useState(false)
  const [tafsirText, setTafsirText] = useState<string | null>(null)
  const [translationText, setTranslationText] = useState<string | null>(null)
  const [audioActive, setAudioActive] = useState(false)

  const [hifzStatus, setHifzStatus] = useState<HifzStatus | null>(null)
  const [hifzMarked, setHifzMarked] = useState(false)

  // Auto-load translation and hifz status when sheet opens
  useEffect(() => {
    if (!visible || !ayahInfo) return
    setLoadingTranslation(true)
    setHifzMarked(false)
    translationService
      .getTranslation(ayahInfo.surahId, ayahInfo.ayahNumber)
      .then((entry) => setTranslationText(entry.text))
      .catch(() => setTranslationText(null))
      .finally(() => setLoadingTranslation(false))

    // Load hifz status
    try {
      hifzService.initHifzDb()
      const progress = hifzService.getAyahProgress(ayahInfo.surahId, 'hafs')
      const ayahProgress = progress.find(p => p.ayahNumber === ayahInfo.ayahNumber)
      setHifzStatus(ayahProgress?.status ?? null)
    } catch {
      setHifzStatus(null)
    }
  }, [visible, ayahInfo])

  const handleClose = useCallback(() => {
    setTafsirText(null)
    setTranslationText(null)
    setAudioActive(false)
    setHifzStatus(null)
    setHifzMarked(false)
    onClose()
  }, [onClose])

  const handleMarkMemorized = useCallback(async () => {
    if (!ayahInfo) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    useHifzStore.getState().markMemorized(ayahInfo.surahId, ayahInfo.ayahNumber, 'hafs')
    setHifzStatus('memorized')
    setHifzMarked(true)
    setTimeout(() => handleClose(), 600)
  }, [ayahInfo, handleClose])

  const handleMarkForReview = useCallback(async () => {
    if (!ayahInfo) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    useHifzStore.getState().markInProgress(ayahInfo.surahId, ayahInfo.ayahNumber, 'hafs')
    setHifzStatus('in_progress')
    setHifzMarked(true)
    setTimeout(() => handleClose(), 600)
  }, [ayahInfo, handleClose])

  const handleBookmark = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Alert.alert('Bookmark', 'Bookmark saved')
  }, [])

  const handlePlayAudio = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setAudioActive((prev) => !prev)
  }, [])

  const handleTafsir = useCallback(async () => {
    if (!ayahInfo) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
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

  const handleCopy = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const text = translationText ?? ''
    if (text) {
      Clipboard.setString(text)
      Alert.alert('Copied', 'Translation copied to clipboard')
    }
  }, [translationText])

  const handleShare = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (!ayahInfo) return
    const surahName = chapters[ayahInfo.surahId]?.nameSimple ?? `Surah ${ayahInfo.surahId}`
    const reference = `${surahName} ${ayahInfo.surahId}:${ayahInfo.ayahNumber}`
    const message = translationText
      ? `"${translationText}"\n\n— ${reference}`
      : reference
    try {
      await Share.share({ message })
    } catch {
      // User cancelled or error — silent
    }
  }, [ayahInfo, translationText])

  const handleDownload = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Alert.alert('Download', 'Download feature coming soon')
  }, [])

  // Derived display values
  const surahName = ayahInfo ? (chapters[ayahInfo.surahId]?.nameSimple ?? `Surah ${ayahInfo.surahId}`) : ''
  const headerTitle = ayahInfo ? `${surahName}: ${ayahInfo.ayahNumber}` : ''

  // Colors
  const bgColor = isDark ? '#1c1c1e' : '#ffffff'
  const textColor = isDark ? '#ffffff' : '#000000'
  const secondaryColor = isDark ? '#8e8e93' : '#666666'
  const borderColor = isDark ? '#38383a' : '#e5e5ea'
  const buttonBg = isDark ? '#2c2c2e' : '#f2f2f7'
  const sectionTitleColor = isDark ? '#8e8e93' : '#6b6b6b'
  const cardBg = isDark ? '#2c2c2e' : '#f7f7f7'

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={[styles.dismissArea, { height: insets.top + 10 }]}
          onPress={handleClose}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: bgColor,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          {/* Handle bar */}
          <View style={[styles.handle, { backgroundColor: secondaryColor }]} />

          {/* Header row */}
          <View style={[styles.headerRow, { borderBottomColor: borderColor }]}>
            <View style={styles.headerSpacer} />
            <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
              {headerTitle}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.6 }]}
              onPress={handleClose}
            >
              <Ionicons name="close" size={22} color={secondaryColor} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Bookmark row */}
            <View style={styles.buttonRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.halfButton,
                  { backgroundColor: buttonBg },
                  pressed && { opacity: 0.6 },
                ]}
                onPress={handleBookmark}
              >
                <Ionicons name="bookmark-outline" size={20} color={textColor} />
                <Text style={[styles.halfButtonLabel, { color: textColor }]}>Bookmark</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.halfButton,
                  { backgroundColor: buttonBg },
                  pressed && { opacity: 0.6 },
                ]}
                onPress={handleBookmark}
              >
                <Text style={[styles.halfButtonLabel, { color: textColor }]}>All Bookmarks</Text>
                <Ionicons name="chevron-forward" size={16} color={secondaryColor} />
              </Pressable>
            </View>

            {/* Recitation section */}
            <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Recitation</Text>
            <View style={styles.buttonRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.halfButton,
                  { backgroundColor: buttonBg },
                  pressed && { opacity: 0.6 },
                ]}
                onPress={handlePlayAudio}
              >
                <Ionicons name="play" size={20} color={textColor} />
                <Text style={[styles.halfButtonLabel, { color: textColor }]}>Play</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.halfButton,
                  { backgroundColor: buttonBg },
                  pressed && { opacity: 0.6 },
                ]}
                onPress={handlePlayAudio}
              >
                <Ionicons name="play" size={18} color={textColor} />
                <Text style={[styles.halfButtonLabel, { color: textColor }]}>Play To</Text>
                <Ionicons name="chevron-forward" size={16} color={secondaryColor} />
              </Pressable>
            </View>

            {audioActive && ayahInfo ? (
              <View style={[styles.audioCard, { backgroundColor: cardBg, borderColor }]}>
                <AyahAudioPlayer surahId={ayahInfo.surahId} ayahNumber={ayahInfo.ayahNumber} />
              </View>
            ) : null}

            {/* Translation section */}
            <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Translation</Text>
            <View style={[styles.translationCard, { backgroundColor: cardBg, borderColor }]}>
              {loadingTranslation ? (
                <ActivityIndicator size="small" color={secondaryColor} style={styles.cardLoader} />
              ) : translationText ? (
                <Text style={[styles.translationText, { color: textColor }]}>{translationText}</Text>
              ) : (
                <Text style={[styles.translationText, { color: secondaryColor }]}>
                  Translation not available
                </Text>
              )}
              <Text style={[styles.translationSource, { color: secondaryColor }]}>
                Saheeh International
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.fullButton,
                { backgroundColor: buttonBg },
                pressed && { opacity: 0.6 },
              ]}
              onPress={handleTafsir}
              disabled={loadingTafsir}
            >
              {loadingTafsir ? (
                <ActivityIndicator size="small" color={secondaryColor} />
              ) : (
                <Ionicons name="book-outline" size={18} color={textColor} />
              )}
              <Text style={[styles.fullButtonLabel, { color: textColor }]}>Tafsir</Text>
              <Ionicons name="chevron-forward" size={16} color={secondaryColor} />
            </Pressable>

            {tafsirText ? (
              <View style={[styles.tafsirCard, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[styles.tafsirLabel, { color: secondaryColor }]}>Ibn Kathir</Text>
                <Text style={[styles.tafsirText, { color: textColor }]}>{tafsirText}</Text>
              </View>
            ) : null}

            {/* Sharing section */}
            <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Sharing</Text>
            <View style={styles.threeButtonRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.thirdButton,
                  { backgroundColor: buttonBg },
                  pressed && { opacity: 0.6 },
                ]}
                onPress={handleCopy}
              >
                <Ionicons name="copy-outline" size={22} color={textColor} />
                <Text style={[styles.thirdButtonLabel, { color: textColor }]}>Copy</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.thirdButton,
                  { backgroundColor: buttonBg },
                  pressed && { opacity: 0.6 },
                ]}
                onPress={handleDownload}
              >
                <Ionicons name="download-outline" size={22} color={textColor} />
                <Text style={[styles.thirdButtonLabel, { color: textColor }]}>Download</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.thirdButton,
                  { backgroundColor: buttonBg },
                  pressed && { opacity: 0.6 },
                ]}
                onPress={handleShare}
              >
                <Ionicons name="share-social-outline" size={22} color={textColor} />
                <Text style={[styles.thirdButtonLabel, { color: textColor }]}>Share</Text>
              </Pressable>
            </View>

            {/* Hifz section */}
            <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Memorization</Text>
            {hifzMarked ? (
              <View style={[styles.hifzConfirmation, { backgroundColor: cardBg, borderColor }]}>
                <Ionicons name="checkmark-circle" size={20} color={isDark ? '#30D158' : '#34C759'} />
                <Text style={[styles.hifzConfirmText, { color: textColor }]}>
                  {hifzStatus === 'memorized' ? 'Marked as Memorized' : 'Marked for Review'}
                </Text>
              </View>
            ) : (
              <View style={styles.buttonRow}>
                {hifzStatus === 'memorized' ? (
                  <View style={[styles.halfButton, { backgroundColor: buttonBg }]}>
                    <Ionicons name="checkmark-circle" size={18} color={isDark ? '#30D158' : '#34C759'} />
                    <Text style={[styles.halfButtonLabel, { color: isDark ? '#30D158' : '#34C759' }]}>Memorized</Text>
                  </View>
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.halfButton,
                      { backgroundColor: buttonBg },
                      pressed && { opacity: 0.6 },
                    ]}
                    onPress={handleMarkMemorized}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color={isDark ? '#30D158' : '#34C759'} />
                    <Text style={[styles.halfButtonLabel, { color: textColor }]}>Mark Memorized</Text>
                  </Pressable>
                )}
                {hifzStatus === 'in_progress' || hifzStatus === 'needs_review' ? (
                  <View style={[styles.halfButton, { backgroundColor: buttonBg }]}>
                    <Ionicons name="repeat" size={18} color={isDark ? '#0A84FF' : '#007AFF'} />
                    <Text style={[styles.halfButtonLabel, { color: isDark ? '#0A84FF' : '#007AFF' }]}>
                      {hifzStatus === 'needs_review' ? 'Needs Review' : 'In Progress'}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.halfButton,
                      { backgroundColor: buttonBg },
                      pressed && { opacity: 0.6 },
                    ]}
                    onPress={handleMarkForReview}
                  >
                    <Ionicons name="repeat-outline" size={18} color={isDark ? '#0A84FF' : '#007AFF'} />
                    <Text style={[styles.halfButtonLabel, { color: textColor }]}>Mark for Review</Text>
                  </Pressable>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
})

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dismissArea: {
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: {
    width: 36,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  halfButtonLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  fullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  fullButtonLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  threeButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  thirdButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 6,
  },
  thirdButtonLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  audioCard: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  translationCard: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  translationText: {
    fontSize: 15,
    lineHeight: 24,
  },
  translationSource: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardLoader: {
    paddingVertical: 8,
  },
  tafsirCard: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  tafsirLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tafsirText: {
    fontSize: 14,
    lineHeight: 22,
  },
  hifzConfirmation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hifzConfirmText: {
    fontSize: 15,
    fontWeight: '500',
  },
})

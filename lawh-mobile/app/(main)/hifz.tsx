/**
 * New Memorization Session Screen
 *
 * Allows users to study unmemorized ayahs and mark them for review.
 * Flow: Select surah -> View ayah text -> "I've memorized this" -> advance
 * Creates initial review_schedule entries (due tomorrow) for each marked ayah.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'
import { useHifzStore } from '@/stores/hifzStore'
import { hifzService } from '@/services/hifzService'
import { chapters } from '@/lib/data/mushafData'
import { V4AyahText } from '@/components/mushaf/V4AyahText'
import { SessionSummary, type SessionResults } from '@/components/session/SessionSummary'

interface AyahItem {
  surahId: number
  ayahNumber: number
}

export default function HifzScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ surahId?: string; startAyah?: string }>()
  const { isDark, backgroundColor, textColor, secondaryTextColor, cardColor, borderColor, accentColor } = useResolvedTheme()

  // Surah selection state
  const [selectedSurahId, setSelectedSurahId] = useState<number | null>(
    params.surahId ? Number(params.surahId) : null
  )

  // Session state
  const [ayahs, setAyahs] = useState<AyahItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [learnedCount, setLearnedCount] = useState(0)
  const [showSummary, setShowSummary] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const startTimeRef = useRef(Date.now())

  // Build surah list for picker
  const surahList = useMemo(() => {
    const list: { id: number; nameSimple: string; nameArabic: string; versesCount: number }[] = []
    for (let i = 1; i <= 114; i++) {
      const ch = chapters[i]
      if (ch) list.push({ id: i, nameSimple: ch.nameSimple, nameArabic: ch.nameArabic, versesCount: ch.versesCount })
    }
    return list
  }, [])

  const startSession = useCallback((surahId: number) => {
    hifzService.initHifzDb()
    setSelectedSurahId(surahId)

    // Get already tracked ayahs for this surah
    const tracked = hifzService.getAyahProgress(surahId, 'hafs')
    const trackedSet = new Set(tracked.map(a => a.ayahNumber))

    const ch = chapters[surahId]
    if (!ch) return

    // Build list of unmemorized ayahs
    const unmemorized: AyahItem[] = []
    for (let i = 1; i <= ch.versesCount; i++) {
      if (!trackedSet.has(i)) {
        unmemorized.push({ surahId, ayahNumber: i })
      }
    }

    if (unmemorized.length === 0) {
      Alert.alert('All Memorized', `All ayahs in ${ch.nameSimple} are already tracked.`, [
        { text: 'OK', onPress: () => setSelectedSurahId(null) },
      ])
      return
    }

    setAyahs(unmemorized)
    setCurrentIndex(0)
    setLearnedCount(0)
    setSessionStarted(true)
    startTimeRef.current = Date.now()
  }, [])

  // Auto-start if surahId param is provided
  React.useEffect(() => {
    if (params.surahId && !sessionStarted) {
      startSession(Number(params.surahId))
    }
  }, [params.surahId])

  const currentAyah = ayahs[currentIndex] ?? null
  const surahName = selectedSurahId
    ? (chapters[selectedSurahId]?.nameSimple ?? `Surah ${selectedSurahId}`)
    : ''

  const handleMarkMemorized = useCallback(async () => {
    if (!currentAyah) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    useHifzStore.getState().markInProgress(
      currentAyah.surahId,
      currentAyah.ayahNumber,
      'hafs',
    )

    setLearnedCount(prev => prev + 1)

    // Advance
    const nextIndex = currentIndex + 1
    if (nextIndex >= ayahs.length) {
      setShowSummary(true)
    } else {
      setCurrentIndex(nextIndex)
    }
  }, [currentAyah, currentIndex, ayahs.length])

  const handleBack = useCallback(() => {
    if (sessionStarted && learnedCount > 0 && !showSummary) {
      Alert.alert(
        'Exit Session',
        `You've learned ${learnedCount} ayah${learnedCount !== 1 ? 's' : ''}. Your progress has been saved. Exit?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => router.back() },
        ],
      )
    } else if (sessionStarted && !showSummary) {
      // No progress yet, go back to picker
      setSessionStarted(false)
      setSelectedSurahId(null)
    } else {
      router.back()
    }
  }, [sessionStarted, learnedCount, showSummary, router])

  const handleSummaryClose = useCallback(() => {
    setShowSummary(false)
    useHifzStore.getState().loadProgress('hafs')
    router.back()
  }, [router])

  // Session results for summary
  const sessionResults: SessionResults = useMemo(() => ({
    ayahsReviewed: learnedCount,
    grades: { again: 0, hard: 0, good: learnedCount, easy: 0 },
    avgStrengthBefore: 0,
    avgStrengthAfter: 0,
    totalTime: (Date.now() - startTimeRef.current) / 1000,
  }), [learnedCount])

  // Surah picker view
  if (!sessionStarted) {
    return (
      <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={accentColor} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: textColor }]}>New Memorization</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={[styles.pickerSubtitle, { color: secondaryTextColor }]}>
          Select a surah to begin memorizing
        </Text>

        <FlatList
          data={surahList}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.pickerList}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.surahRow,
                { backgroundColor: cardColor, borderColor },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => startSession(item.id)}
            >
              <View style={[styles.surahNumber, { backgroundColor: isDark ? '#3a3a3c' : '#e8e8e8' }]}>
                <Text style={[styles.surahNumberText, { color: textColor }]}>{item.id}</Text>
              </View>
              <View style={styles.surahInfo}>
                <Text style={[styles.surahName, { color: textColor }]}>{item.nameSimple}</Text>
                <Text style={[styles.surahVerses, { color: secondaryTextColor }]}>
                  {item.versesCount} ayahs
                </Text>
              </View>
              <Text style={[styles.surahArabic, { color: secondaryTextColor }]}>
                {item.nameArabic}
              </Text>
            </Pressable>
          )}
        />
      </View>
    )
  }

  // Session view
  return (
    <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
          onPress={handleBack}
        >
          <Ionicons name="chevron-back" size={24} color={accentColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>{surahName}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress */}
      <View style={[styles.progressContainer, { backgroundColor: cardColor }]}>
        <View style={[styles.progressBar, { backgroundColor: borderColor }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: accentColor,
                width: `${(currentIndex / ayahs.length) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: secondaryTextColor }]}>
          Learning: {currentIndex + 1} / {ayahs.length} ayahs
        </Text>
      </View>

      {/* Current ayah */}
      {currentAyah && (
        <View style={styles.sessionContent}>
          <Text style={[styles.ayahLabel, { color: secondaryTextColor }]}>
            Ayah {currentAyah.ayahNumber}
          </Text>

          <View style={[styles.ayahCard, { backgroundColor: cardColor, borderColor }]}>
            <V4AyahText
              surahId={currentAyah.surahId}
              ayahNumber={currentAyah.ayahNumber}
              fontSize={28}
              color={textColor}
              style={styles.ayahText}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.memorizedButton,
              { backgroundColor: isDark ? '#30D158' : '#34C759', opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleMarkMemorized}
          >
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={styles.memorizedButtonText}>I've memorized this</Text>
          </Pressable>
        </View>
      )}

      {/* Summary */}
      <SessionSummary
        visible={showSummary}
        onClose={handleSummaryClose}
        results={sessionResults}
        sessionType="Memorization"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 36,
  },
  // Progress
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Surah picker
  pickerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },
  pickerList: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 6,
  },
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  surahNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  surahNumberText: {
    fontSize: 13,
    fontWeight: '600',
  },
  surahInfo: {
    flex: 1,
    gap: 2,
  },
  surahName: {
    fontSize: 15,
    fontWeight: '500',
  },
  surahVerses: {
    fontSize: 12,
  },
  surahArabic: {
    fontSize: 18,
    fontWeight: '500',
  },
  // Session
  sessionContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 16,
  },
  ayahLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  ayahCard: {
    borderRadius: 16,
    padding: 24,
    minHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  ayahText: {
    textAlign: 'center',
    lineHeight: 48,
  },
  memorizedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  memorizedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

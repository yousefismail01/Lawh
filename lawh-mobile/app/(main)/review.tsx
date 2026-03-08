/**
 * Review Session Screen
 *
 * Loads due ayahs from the review queue, presents a blur-reveal-grade loop:
 * 1. Ayah text is blurred behind a "Reveal" button
 * 2. User taps Reveal to see the text
 * 3. Grade bar appears (Again/Hard/Good/Easy)
 * 4. Grading triggers SM-2+ update and advances to next ayah
 * 5. Post-session summary shows results
 *
 * Batch limit: max 20 ayahs per session.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native'
import { useRouter } from 'expo-router'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'
import { useHifzStore } from '@/stores/hifzStore'
import { hifzService } from '@/services/hifzService'
import { sm2plus } from '@/lib/sr/sm2plus'
import { chapters } from '@/lib/data/mushafData'
import { V4AyahText } from '@/components/mushaf/V4AyahText'
import { GradeBar } from '@/components/session/GradeBar'
import { SessionSummary, type SessionResults } from '@/components/session/SessionSummary'
import type { Grade, ReviewCard, ReviewQueueItem } from '@/lib/sr/types'

const BATCH_LIMIT = 20

interface SessionGrade {
  surahId: number
  ayahNumber: number
  grade: Grade
  strengthBefore: number
  strengthAfter: number
}

/**
 * Format interval days as a human-readable string
 */
function formatInterval(days: number): string {
  if (days < 1) return '<1d'
  if (days < 30) return `${Math.round(days)}d`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${(days / 365).toFixed(1)}y`
}

/**
 * Compute projected intervals for all 4 grades given a card
 */
function computeProjections(card: ReviewCard): Record<Grade, string> {
  const grades: Grade[] = [0, 2, 3, 5]
  const result = {} as Record<Grade, string>
  for (const g of grades) {
    const r = sm2plus(card, g)
    result[g] = formatInterval(r.interval)
  }
  return result
}

export default function ReviewScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isDark, backgroundColor, textColor, secondaryTextColor, cardColor, borderColor, accentColor } = useResolvedTheme()

  // Session state
  const [queue, setQueue] = useState<ReviewQueueItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [sessionGrades, setSessionGrades] = useState<SessionGrade[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [flashText, setFlashText] = useState<string | null>(null)
  const startTimeRef = useRef(Date.now())

  // Blur animation
  const blurOpacity = useRef(new Animated.Value(1)).current

  // Load review queue on mount
  useEffect(() => {
    hifzService.initHifzDb()
    const items = hifzService.getReviewQueue('hafs')
    const limited = items.slice(0, BATCH_LIMIT)
    setQueue(limited)
  }, [])

  const currentAyah = queue[currentIndex] ?? null

  // Get current card for projections
  const projections = useMemo(() => {
    if (!currentAyah) return { 0: '1d', 2: '1d', 3: '6d', 5: '6d' } as Record<Grade, string>
    const card: ReviewCard = {
      easeFactor: currentAyah.easeFactor,
      interval: currentAyah.intervalDays,
      repetitions: currentAyah.repetitions,
      dueDate: currentAyah.dueDate,
      consecutiveCorrect: 0, // simplified for projection display
    }
    return computeProjections(card)
  }, [currentAyah])

  const surahName = currentAyah
    ? (chapters[currentAyah.surahId]?.nameSimple ?? `Surah ${currentAyah.surahId}`)
    : ''
  const surahNameAr = currentAyah
    ? (chapters[currentAyah.surahId]?.nameArabic ?? '')
    : ''

  const handleReveal = useCallback(() => {
    setRevealed(true)
    Animated.timing(blurOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [blurOpacity])

  const handleGrade = useCallback((grade: Grade) => {
    if (!currentAyah) return

    const strengthBefore = currentAyah.strengthScore

    // Execute grading via store (writes to SQLite)
    useHifzStore.getState().gradeAyah(
      currentAyah.surahId,
      currentAyah.ayahNumber,
      'hafs',
      grade,
    )

    // Compute new strength for summary tracking
    const card: ReviewCard = {
      easeFactor: currentAyah.easeFactor,
      interval: currentAyah.intervalDays,
      repetitions: currentAyah.repetitions,
      dueDate: currentAyah.dueDate,
      consecutiveCorrect: 0,
    }
    const result = sm2plus(card, grade)

    setSessionGrades(prev => [...prev, {
      surahId: currentAyah.surahId,
      ayahNumber: currentAyah.ayahNumber,
      grade,
      strengthBefore,
      strengthAfter: result.strengthScore,
    }])

    // Brief flash showing the new interval
    setFlashText(`Next review: ${formatInterval(result.interval)}`)
    setTimeout(() => {
      setFlashText(null)
      advanceToNext()
    }, 600)
  }, [currentAyah, currentIndex, queue.length])

  const advanceToNext = useCallback(() => {
    const nextIndex = currentIndex + 1
    if (nextIndex >= queue.length) {
      setShowSummary(true)
    } else {
      setCurrentIndex(nextIndex)
      setRevealed(false)
      blurOpacity.setValue(1)
    }
  }, [currentIndex, queue.length, blurOpacity])

  const handleBack = useCallback(() => {
    if (sessionGrades.length > 0 && !showSummary) {
      Alert.alert(
        'Exit Session',
        `You've reviewed ${sessionGrades.length} ayah${sessionGrades.length !== 1 ? 's' : ''}. Your progress has been saved. Exit?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => router.back() },
        ],
      )
    } else {
      router.back()
    }
  }, [sessionGrades.length, showSummary, router])

  const handleSummaryClose = useCallback(() => {
    setShowSummary(false)
    // Refresh store state
    useHifzStore.getState().loadProgress('hafs')
    useHifzStore.getState().loadReviewQueue('hafs')
    router.back()
  }, [router])

  // Build session results for summary
  const sessionResults: SessionResults = useMemo(() => {
    const grades = { again: 0, hard: 0, good: 0, easy: 0 }
    let sumBefore = 0
    let sumAfter = 0
    for (const sg of sessionGrades) {
      if (sg.grade === 0) grades.again++
      else if (sg.grade === 2) grades.hard++
      else if (sg.grade === 3) grades.good++
      else if (sg.grade === 5) grades.easy++
      sumBefore += sg.strengthBefore
      sumAfter += sg.strengthAfter
    }
    const count = sessionGrades.length || 1
    return {
      ayahsReviewed: sessionGrades.length,
      grades,
      avgStrengthBefore: sumBefore / count,
      avgStrengthAfter: sumAfter / count,
      totalTime: (Date.now() - startTimeRef.current) / 1000,
    }
  }, [sessionGrades])

  // Empty queue state
  if (queue.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-done-circle" size={64} color={isDark ? '#30D158' : '#34C759'} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>All Caught Up!</Text>
          <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
            No ayahs due for review right now.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.emptyButton,
              { backgroundColor: accentColor, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.emptyButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    )
  }

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
        <Text style={[styles.headerTitle, { color: textColor }]}>Review</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress bar */}
      <View style={[styles.progressContainer, { backgroundColor: cardColor }]}>
        <View style={[styles.progressBar, { backgroundColor: borderColor }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: accentColor,
                width: `${((currentIndex + (revealed ? 1 : 0)) / queue.length) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: secondaryTextColor }]}>
          {currentIndex + 1} / {queue.length} ayahs
        </Text>
      </View>

      {/* Ayah display area */}
      {currentAyah && (
        <View style={styles.ayahContainer}>
          {/* Location header */}
          <View style={styles.locationRow}>
            <Text style={[styles.locationText, { color: secondaryTextColor }]}>
              {surahName} : {currentAyah.ayahNumber}
            </Text>
            <Text style={[styles.locationArabic, { color: secondaryTextColor }]}>
              {surahNameAr}
            </Text>
          </View>

          {/* Ayah text with blur overlay */}
          <View style={[styles.ayahCard, { backgroundColor: cardColor, borderColor }]}>
            <V4AyahText
              surahId={currentAyah.surahId}
              ayahNumber={currentAyah.ayahNumber}
              fontSize={28}
              color={textColor}
              style={styles.ayahText}
            />

            {/* Blur overlay (animates out on reveal) */}
            {!revealed && (
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  styles.blurContainer,
                  { opacity: blurOpacity },
                ]}
              >
                <BlurView
                  intensity={80}
                  tint={isDark ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />
                <Pressable
                  style={({ pressed }) => [
                    styles.revealButton,
                    { backgroundColor: accentColor, opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={handleReveal}
                >
                  <Ionicons name="eye-outline" size={20} color="#fff" />
                  <Text style={styles.revealText}>Reveal</Text>
                </Pressable>
              </Animated.View>
            )}
          </View>

          {/* Flash text (after grading) */}
          {flashText && (
            <View style={[styles.flashContainer, { backgroundColor: cardColor }]}>
              <Text style={[styles.flashText, { color: accentColor }]}>{flashText}</Text>
            </View>
          )}

          {/* Grade bar (shown after reveal) */}
          {revealed && !flashText && (
            <GradeBar onGrade={handleGrade} projections={projections} isDark={isDark} />
          )}
        </View>
      )}

      {/* Session Summary */}
      <SessionSummary
        visible={showSummary}
        onClose={handleSummaryClose}
        results={sessionResults}
        sessionType="Review"
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
  // Ayah
  ayahContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  locationArabic: {
    fontSize: 16,
    fontWeight: '500',
  },
  ayahCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 24,
    minHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ayahText: {
    textAlign: 'center',
    lineHeight: 48,
  },
  blurContainer: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  revealText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Flash
  flashContainer: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  flashText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

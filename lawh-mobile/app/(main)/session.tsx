/**
 * Guided Daily Session Screen
 *
 * State-machine-driven flow that walks the user through
 * sabaq -> sabqi -> dhor tiers sequentially.
 * Each tier shows its assignment and waits for user completion/rating.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'
import { useMadinahHifzStore } from '@/stores/madinahHifzStore'
import { getSabaqAllowance, getLevelConfig } from '@/lib/algorithm'
import type { StudentLevel, DailySession, DhorCycleEntry, SabqiAssignment } from '@/lib/algorithm'
import { SessionTierCard } from '@/components/hifz/SessionTierCard'
import { MadinahSessionSummary } from '@/components/hifz/MadinahSessionSummary'

type SessionPhase = 'sabaq' | 'sabqi' | 'dhor' | 'summary'

/** Format a sabaq/sabqi/dhor entry as human-readable assignment string */
function formatAssignment(entry: { juz: number; startPage: number; endPage: number }): string {
  return `Juz ${entry.juz}, p.${entry.startPage}-${entry.endPage}`
}

function pageCount(entry: { startPage: number; endPage: number }): number {
  return entry.endPage - entry.startPage + 1
}

/** Step indicator dots for sabaq/sabqi/dhor */
function PhaseIndicator({
  currentPhase,
  hasSabaq,
  hasSabqi,
  hasDhor,
  isDark,
}: {
  currentPhase: SessionPhase
  hasSabaq: boolean
  hasSabqi: boolean
  hasDhor: boolean
  isDark: boolean
}) {
  const phases: { key: SessionPhase; label: string; has: boolean }[] = [
    { key: 'sabaq', label: 'Sabaq', has: hasSabaq },
    { key: 'sabqi', label: 'Sabqi', has: hasSabqi },
    { key: 'dhor', label: 'Dhor', has: hasDhor },
  ]
  const activeBg = isDark ? '#4ade80' : '#16a34a'
  const inactiveBg = isDark ? '#3a3a3a' : '#d4d4d4'
  const activeText = '#fff'
  const inactiveText = isDark ? '#888' : '#999'

  const phaseOrder = phases.filter((p) => p.has).map((p) => p.key)
  const currentIndex = phaseOrder.indexOf(
    currentPhase === 'summary' ? phaseOrder[phaseOrder.length - 1] : currentPhase,
  )

  return (
    <View style={stepStyles.container}>
      {phases
        .filter((p) => p.has)
        .map((p, i) => {
          const isActive = currentPhase === p.key
          const isPast = i < currentIndex || currentPhase === 'summary'
          const dotColor = isActive || isPast ? activeBg : inactiveBg
          const labelColor = isActive ? (isDark ? '#fff' : '#000') : inactiveText

          return (
            <React.Fragment key={p.key}>
              {i > 0 && (
                <View
                  style={[
                    stepStyles.line,
                    { backgroundColor: isPast ? activeBg : inactiveBg },
                  ]}
                />
              )}
              <View style={stepStyles.step}>
                <View style={[stepStyles.dot, { backgroundColor: dotColor }]}>
                  {isPast && !isActive ? (
                    <Ionicons name="checkmark" size={12} color={activeText} />
                  ) : (
                    <Text style={[stepStyles.dotText, { color: activeText }]}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text style={[stepStyles.label, { color: labelColor }]}>
                  {p.label}
                </Text>
              </View>
            </React.Fragment>
          )
        })}
    </View>
  )
}

export default function SessionScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const {
    isDark,
    backgroundColor,
    textColor,
    secondaryTextColor,
    cardColor,
    borderColor,
    accentColor,
  } = useResolvedTheme()

  // Store state
  const todaySession = useMadinahHifzStore((s) => s.todaySession)
  const studentLevel = useMadinahHifzStore((s) => s.studentLevel)
  const levelTransitionDetected = useMadinahHifzStore((s) => s.levelTransitionDetected)
  const previousLevel = useMadinahHifzStore((s) => s.previousLevel)

  // Session state machine
  const [phase, setPhase] = useState<SessionPhase>('sabaq')
  const [sabaqDone, setSabaqDone] = useState(false)
  const [sabqiRatings, setSabqiRatings] = useState<Record<number, number>>({})
  const [dhorRatings, setDhorRatings] = useState<Record<number, number>>({})
  const [showSummary, setShowSummary] = useState(false)
  const startTimeRef = useRef(Date.now())

  // Derived session data
  const hasSabaq = todaySession?.sabaq != null
  const sabqiEntries = todaySession?.sabqi ?? []
  const dhorEntries = todaySession?.dhor ?? []
  const hasSabqi = sabqiEntries.length > 0
  const hasDhor = dhorEntries.length > 0

  // Compute sabaq pause state
  const sabaqPaused = useMemo(() => {
    if (!todaySession || todaySession.sabaq != null) return null
    // Sabaq is null -- check if it's because it's paused
    return {
      isPaused: true,
      reason: 'Sabaq paused -- focus on strengthening your existing memorization.',
    }
  }, [todaySession])

  // Determine the initial phase
  useEffect(() => {
    if (!todaySession) return
    if (hasSabaq || sabaqPaused) {
      setPhase('sabaq')
    } else if (hasSabqi) {
      setPhase('sabqi')
    } else if (hasDhor) {
      setPhase('dhor')
    } else {
      setPhase('summary')
    }
  }, []) // only on mount

  // Computed page counts for summary
  const sabaqPages = todaySession?.sabaq
    ? pageCount(todaySession.sabaq)
    : 0
  const sabqiPages = sabqiEntries.reduce((s, e) => s + pageCount(e), 0)
  const dhorPages = dhorEntries.reduce((s, e) => s + pageCount(e), 0)

  // Check if any progress has been made (for exit confirmation)
  const hasProgress = sabaqDone || Object.keys(sabqiRatings).length > 0 || Object.keys(dhorRatings).length > 0

  const handleBack = useCallback(() => {
    if (hasProgress) {
      Alert.alert(
        'Exit Session',
        'You have progress in this session. Are you sure you want to exit?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => router.back() },
        ],
      )
    } else {
      router.back()
    }
  }, [hasProgress, router])

  // Phase transition helpers
  const advanceFromSabaq = useCallback(() => {
    setSabaqDone(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    if (hasSabqi) {
      setPhase('sabqi')
    } else if (hasDhor) {
      setPhase('dhor')
    } else {
      setPhase('summary')
    }
  }, [hasSabqi, hasDhor])

  const handleSabqiRate = useCallback(
    (juz: number, score: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setSabqiRatings((prev) => {
        const updated = { ...prev, [juz]: score }
        // Check if all sabqi entries are rated
        if (Object.keys(updated).length >= sabqiEntries.length) {
          // Auto-advance after a short delay for visual feedback
          setTimeout(() => {
            if (hasDhor) {
              setPhase('dhor')
            } else {
              setPhase('summary')
            }
          }, 500)
        }
        return updated
      })
    },
    [sabqiEntries.length, hasDhor],
  )

  const handleDhorRate = useCallback(
    (juz: number, score: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setDhorRatings((prev) => {
        const updated = { ...prev, [juz]: score }
        // Check if all dhor entries are rated
        if (Object.keys(updated).length >= dhorEntries.length) {
          setTimeout(() => {
            setPhase('summary')
          }, 500)
        }
        return updated
      })
    },
    [dhorEntries.length],
  )

  // Handle entering summary phase
  useEffect(() => {
    if (phase !== 'summary') return
    if (showSummary) return // already showing

    const totalMinutes = Math.round((Date.now() - startTimeRef.current) / 60000)
    const allRatings = { ...sabqiRatings, ...dhorRatings }

    // Call completeSession in the store
    useMadinahHifzStore.getState().completeSession(allRatings, totalMinutes)
    setShowSummary(true)
  }, [phase])

  const handleSummaryClose = useCallback(() => {
    setShowSummary(false)
    router.back()
  }, [router])

  // Error state: no session available
  if (!todaySession) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor, paddingTop: insets.top },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Today's Session
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={secondaryTextColor}
          />
          <Text style={[styles.errorText, { color: secondaryTextColor }]}>
            No session available. Please set up your hifz plan first.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.errorButton,
              { backgroundColor: accentColor, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  // Compute level transition info for summary
  const levelTransition =
    levelTransitionDetected && previousLevel && studentLevel
      ? { from: previousLevel, to: studentLevel }
      : null

  const totalMinutes = Math.round((Date.now() - startTimeRef.current) / 60000)

  return (
    <View
      style={[styles.container, { backgroundColor, paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          Today's Session
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Phase indicator */}
      <PhaseIndicator
        currentPhase={phase}
        hasSabaq={hasSabaq || sabaqPaused != null}
        hasSabqi={hasSabqi}
        hasDhor={hasDhor}
        isDark={isDark}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Phase title */}
        <Text style={[styles.phaseTitle, { color: textColor }]}>
          {phase === 'sabaq' && 'New Memorization'}
          {phase === 'sabqi' && 'Recent Review'}
          {phase === 'dhor' && 'Revision'}
          {phase === 'summary' && 'Session Complete'}
        </Text>
        <Text style={[styles.phaseSubtitle, { color: secondaryTextColor }]}>
          {phase === 'sabaq' &&
            (sabaqPaused
              ? 'Sabaq is paused to strengthen your revision.'
              : `Read and memorize ${sabaqPages} page${sabaqPages !== 1 ? 's' : ''} of new material.`)}
          {phase === 'sabqi' &&
            `Review ${sabqiEntries.length} recent assignment${sabqiEntries.length !== 1 ? 's' : ''} and rate your quality.`}
          {phase === 'dhor' &&
            `Revise ${dhorEntries.length} assignment${dhorEntries.length !== 1 ? 's' : ''} from your rotation cycle.`}
          {phase === 'summary' && 'Great work! Review your results below.'}
        </Text>

        {/* Sabaq phase */}
        {phase === 'sabaq' && (
          <SessionTierCard
            tier="sabaq"
            assignment={
              todaySession.sabaq
                ? formatAssignment(todaySession.sabaq)
                : 'Paused'
            }
            pages={sabaqPages}
            status="active"
            isPaused={sabaqPaused != null}
            pauseReason={sabaqPaused?.reason}
            onMarkComplete={advanceFromSabaq}
          />
        )}

        {/* Show upcoming tiers when in sabaq phase */}
        {phase === 'sabaq' && hasSabqi && (
          <>
            {sabqiEntries.map((entry) => (
              <SessionTierCard
                key={`sabqi-${entry.juz}`}
                tier="sabqi"
                assignment={formatAssignment(entry)}
                pages={pageCount(entry)}
                status="upcoming"
                onMarkComplete={() => {}}
              />
            ))}
          </>
        )}
        {phase === 'sabaq' && hasDhor && (
          <>
            {dhorEntries.map((entry) => (
              <SessionTierCard
                key={`dhor-${entry.juz}`}
                tier="dhor"
                assignment={formatAssignment(entry)}
                pages={pageCount(entry)}
                status="upcoming"
                onMarkComplete={() => {}}
              />
            ))}
          </>
        )}

        {/* Sabqi phase */}
        {phase === 'sabqi' && (
          <>
            {/* Show completed sabaq if applicable */}
            {(hasSabaq || sabaqPaused != null) && (
              <SessionTierCard
                tier="sabaq"
                assignment={
                  todaySession.sabaq
                    ? formatAssignment(todaySession.sabaq)
                    : 'Paused'
                }
                pages={sabaqPages}
                status="completed"
                isPaused={sabaqPaused != null}
                onMarkComplete={() => {}}
              />
            )}

            {sabqiEntries.map((entry) => {
              const rated = sabqiRatings[entry.juz]
              return (
                <SessionTierCard
                  key={`sabqi-${entry.juz}`}
                  tier="sabqi"
                  assignment={formatAssignment(entry)}
                  pages={pageCount(entry)}
                  status={rated != null ? 'completed' : 'active'}
                  rating={rated}
                  onMarkComplete={() => {}}
                  onRate={(score) => handleSabqiRate(entry.juz, score)}
                />
              )
            })}

            {/* Upcoming dhor */}
            {hasDhor &&
              dhorEntries.map((entry) => (
                <SessionTierCard
                  key={`dhor-${entry.juz}`}
                  tier="dhor"
                  assignment={formatAssignment(entry)}
                  pages={pageCount(entry)}
                  status="upcoming"
                  onMarkComplete={() => {}}
                />
              ))}
          </>
        )}

        {/* Dhor phase */}
        {phase === 'dhor' && (
          <>
            {/* Show completed sabaq */}
            {(hasSabaq || sabaqPaused != null) && (
              <SessionTierCard
                tier="sabaq"
                assignment={
                  todaySession.sabaq
                    ? formatAssignment(todaySession.sabaq)
                    : 'Paused'
                }
                pages={sabaqPages}
                status="completed"
                isPaused={sabaqPaused != null}
                onMarkComplete={() => {}}
              />
            )}

            {/* Show completed sabqi */}
            {sabqiEntries.map((entry) => (
              <SessionTierCard
                key={`sabqi-${entry.juz}`}
                tier="sabqi"
                assignment={formatAssignment(entry)}
                pages={pageCount(entry)}
                status="completed"
                rating={sabqiRatings[entry.juz]}
                onMarkComplete={() => {}}
              />
            ))}

            {/* Active dhor entries */}
            {dhorEntries.map((entry) => {
              const rated = dhorRatings[entry.juz]
              return (
                <SessionTierCard
                  key={`dhor-${entry.juz}`}
                  tier="dhor"
                  assignment={formatAssignment(entry)}
                  pages={pageCount(entry)}
                  status={rated != null ? 'completed' : 'active'}
                  rating={rated}
                  onMarkComplete={() => {}}
                  onRate={(score) => handleDhorRate(entry.juz, score)}
                />
              )
            })}
          </>
        )}

        {/* Skip sabaq button when paused */}
        {phase === 'sabaq' && sabaqPaused != null && (
          <Pressable
            style={({ pressed }) => [
              styles.skipButton,
              {
                backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={advanceFromSabaq}
          >
            <Text style={[styles.skipButtonText, { color: accentColor }]}>
              Continue to {hasSabqi ? 'Sabqi' : hasDhor ? 'Dhor' : 'Summary'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={accentColor} />
          </Pressable>
        )}
      </ScrollView>

      {/* Session Summary modal */}
      <MadinahSessionSummary
        visible={showSummary}
        onClose={handleSummaryClose}
        sabaqPages={sabaqPages}
        sabqiPages={sabqiPages}
        sabqiRatings={sabqiRatings}
        dhorPages={dhorPages}
        dhorRatings={dhorRatings}
        totalMinutes={totalMinutes}
        levelTransition={levelTransition}
      />
    </View>
  )
}

const stepStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  step: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  line: {
    height: 2,
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 1,
  },
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  phaseTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  phaseSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
    gap: 8,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
})

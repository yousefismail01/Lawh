/**
 * MadinahSetup - 3-step setup wizard for Madinah-method hifz onboarding.
 *
 * Step 1: Select memorized juz (30-cell grid, multi-select)
 * Step 2: Choose current sabaq position (juz + page)
 * Step 3: Set active study days per week (7 day circles)
 */

import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useMadinahHifzStore } from '@/stores/madinahHifzStore'

interface MadinahSetupProps {
  isDark: boolean
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function MadinahSetup({ isDark }: MadinahSetupProps) {
  const completeSetup = useMadinahHifzStore((s) => s.completeSetup)

  const [step, setStep] = useState(1)
  const [selectedJuz, setSelectedJuz] = useState<Set<number>>(new Set())
  const [sabaqJuz, setSabaqJuz] = useState<number | null>(null)
  const [sabaqPage, setSabaqPage] = useState(1)
  const [activeDays, setActiveDays] = useState<Set<number>>(
    new Set([0, 1, 2, 3, 4]), // Sun-Thu default (5 days)
  )

  const c = buildColors(isDark)

  const unselectedJuz = useMemo(() => {
    const result: number[] = []
    for (let i = 1; i <= 30; i++) {
      if (!selectedJuz.has(i)) result.push(i)
    }
    return result
  }, [selectedJuz])

  const allSelected = selectedJuz.size === 30

  const toggleJuz = (juz: number) => {
    setSelectedJuz((prev) => {
      const next = new Set(prev)
      if (next.has(juz)) {
        next.delete(juz)
      } else {
        next.add(juz)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelectedJuz(new Set())
    } else {
      const all = new Set<number>()
      for (let i = 1; i <= 30; i++) all.add(i)
      setSelectedJuz(all)
    }
  }

  const toggleDay = (day: number) => {
    setActiveDays((prev) => {
      const next = new Set(prev)
      if (next.has(day)) {
        next.delete(day)
      } else {
        next.add(day)
      }
      return next
    })
  }

  const handleNext1 = () => {
    if (allSelected) {
      // All 30 memorized = review-only mode, skip step 2
      setSabaqJuz(null)
      setStep(3)
    } else {
      setStep(2)
    }
  }

  const handleNext2 = () => {
    setStep(3)
  }

  const handleFinish = () => {
    completeSetup({
      memorizedJuz: Array.from(selectedJuz).sort((a, b) => a - b),
      currentSabaqJuz: sabaqJuz,
      currentSabaqPage: sabaqPage,
      activeDaysPerWeek: activeDays.size,
    })
  }

  // Step 1: Juz selection grid
  if (step === 1) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: c.bg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconRow}>
          <Ionicons name="book-outline" size={40} color={c.accent} />
        </View>
        <Text style={[styles.title, { color: c.text }]}>
          What have you memorized?
        </Text>
        <Text style={[styles.subtitle, { color: c.muted }]}>
          Select the juz you have already memorized
        </Text>

        <Pressable onPress={toggleAll} style={styles.toggleLink}>
          <Text style={[styles.toggleLinkText, { color: c.accent }]}>
            {allSelected ? 'Clear All' : 'Select All'}
          </Text>
        </Pressable>

        <View style={styles.juzGrid}>
          {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
            const isSelected = selectedJuz.has(juz)
            return (
              <Pressable
                key={juz}
                style={[
                  styles.juzCell,
                  {
                    backgroundColor: isSelected ? c.accent : c.card,
                    borderColor: isSelected ? c.accent : c.border,
                  },
                ]}
                onPress={() => toggleJuz(juz)}
              >
                <Text
                  style={[
                    styles.juzCellText,
                    { color: isSelected ? '#fff' : c.text },
                  ]}
                >
                  {juz}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <Text style={[styles.countText, { color: c.muted }]}>
          {selectedJuz.size} juz selected
        </Text>

        <Pressable
          style={[
            styles.primaryBtn,
            { backgroundColor: selectedJuz.size > 0 ? c.accent : c.border },
          ]}
          onPress={handleNext1}
          disabled={selectedJuz.size === 0}
        >
          <Text style={styles.primaryBtnText}>Next</Text>
        </Pressable>
      </ScrollView>
    )
  }

  // Step 2: Current sabaq position
  if (step === 2) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: c.bg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconRow}>
          <Ionicons name="pencil-outline" size={40} color={c.accent} />
        </View>
        <Text style={[styles.title, { color: c.text }]}>
          Where are you memorizing now?
        </Text>
        <Text style={[styles.subtitle, { color: c.muted }]}>
          Select the juz you are currently working on
        </Text>

        {/* "Only reviewing" option */}
        <Pressable
          style={[
            styles.optionCard,
            {
              backgroundColor: c.card,
              borderColor: sabaqJuz === null ? c.accent : c.border,
              borderWidth: sabaqJuz === null ? 2 : StyleSheet.hairlineWidth,
            },
          ]}
          onPress={() => setSabaqJuz(null)}
        >
          <Text style={[styles.optionLabel, { color: c.text }]}>
            I'm only reviewing
          </Text>
          <Text style={[styles.optionDesc, { color: c.muted }]}>
            Not memorizing new material right now
          </Text>
        </Pressable>

        {/* Unselected juz list */}
        {unselectedJuz.map((juz) => (
          <Pressable
            key={juz}
            style={[
              styles.optionCard,
              {
                backgroundColor: c.card,
                borderColor: sabaqJuz === juz ? c.accent : c.border,
                borderWidth: sabaqJuz === juz ? 2 : StyleSheet.hairlineWidth,
              },
            ]}
            onPress={() => setSabaqJuz(juz)}
          >
            <Text style={[styles.optionLabel, { color: c.text }]}>
              Juz {juz}
            </Text>
          </Pressable>
        ))}

        {/* Page picker (only if juz selected) */}
        {sabaqJuz !== null && (
          <View style={styles.pagePickerSection}>
            <Text style={[styles.pagePickerLabel, { color: c.muted }]}>
              Approximate page within Juz {sabaqJuz}
            </Text>
            <View style={[styles.stepperRow, { borderColor: c.border }]}>
              <Pressable
                onPress={() => setSabaqPage(Math.max(1, sabaqPage - 1))}
                hitSlop={12}
                style={styles.stepBtn}
              >
                <Ionicons name="remove-circle-outline" size={28} color={c.muted} />
              </Pressable>
              <Text style={[styles.stepperValue, { color: c.text }]}>
                {sabaqPage}
              </Text>
              <Pressable
                onPress={() => setSabaqPage(Math.min(20, sabaqPage + 1))}
                hitSlop={12}
                style={styles.stepBtn}
              >
                <Ionicons name="add-circle-outline" size={28} color={c.muted} />
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.btnRow}>
          <Pressable
            style={[styles.backBtn, { borderColor: c.border }]}
            onPress={() => setStep(1)}
          >
            <Text style={[styles.backBtnText, { color: c.muted }]}>Back</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: c.accent, flex: 1 }]}
            onPress={handleNext2}
          >
            <Text style={styles.primaryBtnText}>Next</Text>
          </Pressable>
        </View>
      </ScrollView>
    )
  }

  // Step 3: Active days
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.bg }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.iconRow}>
        <Ionicons name="calendar-outline" size={40} color={c.accent} />
      </View>
      <Text style={[styles.title, { color: c.text }]}>Your Schedule</Text>
      <Text style={[styles.subtitle, { color: c.muted }]}>
        Which days do you study? (at least 3)
      </Text>

      <View style={styles.daysRow}>
        {DAY_LABELS.map((label, i) => {
          const isActive = activeDays.has(i)
          return (
            <Pressable
              key={i}
              style={[
                styles.dayCircle,
                {
                  backgroundColor: isActive ? c.accent : c.card,
                  borderColor: isActive ? c.accent : c.border,
                },
              ]}
              onPress={() => toggleDay(i)}
            >
              <Text
                style={[
                  styles.dayLabel,
                  { color: isActive ? '#fff' : c.text },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <Text style={[styles.countText, { color: c.muted }]}>
        {activeDays.size} days per week
      </Text>

      {activeDays.size < 3 && (
        <Text style={[styles.warningText, { color: '#f59e0b' }]}>
          Select at least 3 days for effective memorization
        </Text>
      )}

      <View style={styles.summaryBox}>
        <Text style={[styles.summaryTitle, { color: c.text }]}>Summary</Text>
        <Text style={[styles.summaryItem, { color: c.muted }]}>
          {selectedJuz.size} juz memorized
        </Text>
        {sabaqJuz !== null ? (
          <Text style={[styles.summaryItem, { color: c.muted }]}>
            Currently memorizing Juz {sabaqJuz}, page {sabaqPage}
          </Text>
        ) : (
          <Text style={[styles.summaryItem, { color: c.muted }]}>
            Review-only mode
          </Text>
        )}
        <Text style={[styles.summaryItem, { color: c.muted }]}>
          {activeDays.size} active days/week
        </Text>
      </View>

      <View style={styles.btnRow}>
        <Pressable
          style={[styles.backBtn, { borderColor: c.border }]}
          onPress={() => setStep(allSelected ? 1 : 2)}
        >
          <Text style={[styles.backBtnText, { color: c.muted }]}>Back</Text>
        </Pressable>
        <Pressable
          style={[
            styles.primaryBtn,
            {
              backgroundColor: activeDays.size >= 3 ? c.accent : c.border,
              flex: 1,
            },
          ]}
          onPress={handleFinish}
          disabled={activeDays.size < 3}
        >
          <Text style={styles.primaryBtnText}>Start</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

function buildColors(isDark: boolean) {
  return {
    bg: isDark ? '#111' : '#fff',
    card: isDark ? '#1e1e1e' : '#f8f8f8',
    border: isDark ? '#2a2a2a' : '#e0e0e0',
    text: isDark ? '#fff' : '#1a1a1a',
    muted: isDark ? '#888' : '#777',
    accent: isDark ? '#4ade80' : '#16a34a',
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  iconRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  toggleLink: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  toggleLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  juzGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  juzCell: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  juzCellText: {
    fontSize: 16,
    fontWeight: '600',
  },
  countText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  optionCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
  },
  pagePickerSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  pagePickerLabel: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  stepBtn: {
    padding: 4,
  },
  stepperValue: {
    fontSize: 32,
    fontWeight: '700',
    minWidth: 48,
    textAlign: 'center',
  },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  backBtn: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  backBtnText: {
    fontSize: 17,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryBox: {
    marginTop: 8,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryItem: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
})

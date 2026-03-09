/**
 * Madinah Hifz Store
 *
 * Zustand store with AsyncStorage persistence that bridges
 * the pure Madinah-method algorithm to the React Native UI.
 *
 * Uses only pure algorithm functions -- no DB or service imports.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type {
  StudentLevel,
  MemorizedJuz,
  StudentState,
  DailySession,
  DhorCycle,
} from '@/lib/algorithm'
import {
  getStudentLevel,
  generateDhorCycle,
  generateDailySession,
  PAGES_PER_JUZ,
} from '@/lib/algorithm'

interface MadinahHifzState {
  // Persisted student profile (set during setup)
  setupComplete: boolean
  memorizedJuzNumbers: number[]
  currentSabaqJuz: number | null
  currentSabaqPage: number
  activeDaysPerWeek: number
  juzQualityScores: Record<number, number>
  dhorDayNumber: number

  // Derived (computed on load, not persisted)
  studentLevel: StudentLevel | null
  todaySession: DailySession | null
  dhorCycle: DhorCycle | null

  // Hydration
  _hasHydrated: boolean
  setHasHydrated: (h: boolean) => void

  // Actions
  completeSetup: (config: {
    memorizedJuz: number[]
    currentSabaqJuz: number | null
    currentSabaqPage: number
    activeDaysPerWeek: number
  }) => void
  generateToday: () => void
  resetSetup: () => void
}

function buildMemorizedJuz(
  juzNumbers: number[],
  qualityScores: Record<number, number>,
): MemorizedJuz[] {
  const today = new Date().toISOString().slice(0, 10)
  return juzNumbers.map((juz) => ({
    juz,
    pages: PAGES_PER_JUZ,
    avgQuality: qualityScores[juz] ?? 3.5,
    lastReviewed: today,
    lapses: 0,
  }))
}

function computeIsActiveDay(dayOfWeek: number, activeDaysPerWeek: number): boolean {
  // First N days of the week are active, starting Sunday=0
  return dayOfWeek < activeDaysPerWeek
}

export const useMadinahHifzStore = create<MadinahHifzState>()(
  persist(
    (set, get) => ({
      // Persisted defaults
      setupComplete: false,
      memorizedJuzNumbers: [],
      currentSabaqJuz: null,
      currentSabaqPage: 1,
      activeDaysPerWeek: 5,
      juzQualityScores: {},
      dhorDayNumber: 0,

      // Derived defaults
      studentLevel: null,
      todaySession: null,
      dhorCycle: null,

      // Hydration
      _hasHydrated: false,
      setHasHydrated: (h) => set({ _hasHydrated: h }),

      completeSetup: (config) => {
        set({
          setupComplete: true,
          memorizedJuzNumbers: config.memorizedJuz,
          currentSabaqJuz: config.currentSabaqJuz,
          currentSabaqPage: config.currentSabaqPage,
          activeDaysPerWeek: config.activeDaysPerWeek,
          dhorDayNumber: 0,
          juzQualityScores: Object.fromEntries(
            config.memorizedJuz.map((j) => [j, 3.5]),
          ),
        })
        // Generate session after state is saved
        setTimeout(() => get().generateToday(), 0)
      },

      generateToday: () => {
        const state = get()
        if (!state.setupComplete || state.memorizedJuzNumbers.length === 0) {
          set({ todaySession: null, studentLevel: null, dhorCycle: null })
          return
        }

        const memorizedJuz = buildMemorizedJuz(
          state.memorizedJuzNumbers,
          state.juzQualityScores,
        )

        const level = getStudentLevel(state.memorizedJuzNumbers.length)
        const dhorCycle = generateDhorCycle(memorizedJuz, level)

        const now = new Date()
        const sessionDate = now.toISOString().slice(0, 10)
        const dayOfWeek = now.getDay()
        const isActiveDay = computeIsActiveDay(dayOfWeek, state.activeDaysPerWeek)

        // Compute average dhor quality
        const qualityValues = Object.values(state.juzQualityScores)
        const dhorAvgQuality =
          qualityValues.length > 0
            ? qualityValues.reduce((a, b) => a + b, 0) / qualityValues.length
            : 3.5

        const studentState: StudentState = {
          memorizedJuz,
          currentSabaqJuz: state.currentSabaqJuz,
          currentSabaqPage: state.currentSabaqPage,
          activeDaysPerWeek: state.activeDaysPerWeek,
          totalPagesMemorized: state.memorizedJuzNumbers.length * PAGES_PER_JUZ,
        }

        const todaySession = generateDailySession(
          studentState,
          dhorCycle,
          state.dhorDayNumber,
          dayOfWeek,
          isActiveDay,
          dhorAvgQuality,
          0, // consecutiveWeakDhorDays
          sessionDate,
        )

        set({
          studentLevel: level,
          todaySession,
          dhorCycle,
        })
      },

      resetSetup: () => {
        set({
          setupComplete: false,
          memorizedJuzNumbers: [],
          currentSabaqJuz: null,
          currentSabaqPage: 1,
          activeDaysPerWeek: 5,
          juzQualityScores: {},
          dhorDayNumber: 0,
          studentLevel: null,
          todaySession: null,
          dhorCycle: null,
        })
      },
    }),
    {
      name: 'lawh-madinah-hifz',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true)
          // Regenerate session after hydration
          if (state.setupComplete) {
            setTimeout(() => state.generateToday(), 0)
          }
        }
      },
      partialize: (state) => ({
        setupComplete: state.setupComplete,
        memorizedJuzNumbers: state.memorizedJuzNumbers,
        currentSabaqJuz: state.currentSabaqJuz,
        currentSabaqPage: state.currentSabaqPage,
        activeDaysPerWeek: state.activeDaysPerWeek,
        juzQualityScores: state.juzQualityScores,
        dhorDayNumber: state.dhorDayNumber,
      }),
    },
  ),
)

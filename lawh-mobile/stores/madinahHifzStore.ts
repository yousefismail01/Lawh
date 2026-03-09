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
  AyahBoundaryMode,
  MemorizationUnit,
} from '@/lib/algorithm'
import {
  getStudentLevel,
  generateDhorCycle,
  generateDailySession,
  resolveSabaqUnit,
  PAGES_PER_JUZ,
} from '@/lib/algorithm'
import { useHifzStore } from '@/stores/hifzStore'
import { chapters } from '@/lib/data/mushafData'
import { JUZ_START_PAGES } from '@/lib/data/pageJuzHizb'
import { SURAH_START_PAGES } from '@/lib/data/contentsData'

/** A single completed session record for history tracking */
interface SessionRecord {
  date: string // ISO date
  level: StudentLevel
  sabaqPages: number
  sabqiPages: number
  dhorPages: number
  ratings: Record<number, number> // juz -> quality 1-5
  totalMinutes: number
}

/** Sabaq amount unit */
type SabaqUnit = 'pages'

interface MadinahHifzState {
  // Persisted student profile (set during setup)
  setupComplete: boolean
  memorizedJuzNumbers: number[]
  memorizedSurahIds: number[]
  currentSabaqJuz: number | null
  currentSabaqPage: number
  activeDaysPerWeek: number
  /** Specific active day-of-week numbers (0=Sun..6=Sat). When set, used for isActiveDay checks. */
  activeDayNumbers: number[]
  juzQualityScores: Record<number, number>
  dhorDayNumber: number
  /** User override for sabaq pages per day (0.5 increments). null = use level default */
  sabaqPagesOverride: number | null
  /** Ayah boundary snapping mode for half-page units */
  ayahBoundaryMode: AyahBoundaryMode

  // Session tracking (persisted)
  lastSessionDate: string | null
  completedSessionDates: string[]
  previousLevel: StudentLevel | null
  sessionHistory: SessionRecord[]

  // Derived (computed on load, not persisted)
  studentLevel: StudentLevel | null
  todaySession: DailySession | null
  dhorCycle: DhorCycle | null
  levelTransitionDetected: boolean
  /** Resolved ayah-bounded memorization unit for current sabaq */
  sabaqUnit: MemorizationUnit | null

  // Hydration
  _hasHydrated: boolean
  setHasHydrated: (h: boolean) => void

  // Actions
  completeSetup: (config: {
    memorizedJuz: number[]
    memorizedSurahIds?: number[]
    currentSabaqJuz: number | null
    currentSabaqPage: number
    activeDaysPerWeek: number
    activeDayNumbers?: number[]
  }) => void
  generateToday: () => void
  resetSetup: () => void
  setSabaqPagesOverride: (pages: number | null) => void
  setAyahBoundaryMode: (mode: AyahBoundaryMode) => void
  completeSession: (ratings: Record<number, number>, totalMinutes: number) => void
  getMissedDays: () => number
  dismissLevelTransition: () => void
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

function computeIsActiveDay(dayOfWeek: number, activeDaysPerWeek: number, activeDayNumbers?: number[]): boolean {
  // Use specific day numbers if available, otherwise fall back to first N days
  if (activeDayNumbers && activeDayNumbers.length > 0) {
    return activeDayNumbers.includes(dayOfWeek)
  }
  return dayOfWeek < activeDaysPerWeek
}

export const useMadinahHifzStore = create<MadinahHifzState>()(
  persist(
    (set, get) => ({
      // Persisted defaults
      setupComplete: false,
      memorizedJuzNumbers: [],
      memorizedSurahIds: [],
      currentSabaqJuz: null,
      currentSabaqPage: 1,
      activeDaysPerWeek: 5,
      activeDayNumbers: [0, 1, 2, 3, 4],
      juzQualityScores: {},
      dhorDayNumber: 0,
      sabaqPagesOverride: null,
      ayahBoundaryMode: 'round_down' as AyahBoundaryMode,

      // Session tracking defaults
      lastSessionDate: null,
      completedSessionDates: [],
      previousLevel: null,
      sessionHistory: [],

      // Derived defaults
      studentLevel: null,
      todaySession: null,
      dhorCycle: null,
      levelTransitionDetected: false,
      sabaqUnit: null,

      // Hydration
      _hasHydrated: false,
      setHasHydrated: (h) => set({ _hasHydrated: h }),

      completeSetup: (config) => {
        set({
          setupComplete: true,
          memorizedJuzNumbers: config.memorizedJuz,
          memorizedSurahIds: config.memorizedSurahIds ?? [],
          currentSabaqJuz: config.currentSabaqJuz,
          currentSabaqPage: config.currentSabaqPage,
          activeDaysPerWeek: config.activeDaysPerWeek,
          activeDayNumbers: config.activeDayNumbers ?? [],
          dhorDayNumber: 0,
          juzQualityScores: Object.fromEntries(
            config.memorizedJuz.map((j) => [j, 3.5]),
          ),
        })
        // Auto-adjust sabaqPage based on memorized surahs within the sabaq juz
        if (config.currentSabaqJuz !== null && config.memorizedSurahIds && config.memorizedSurahIds.length > 0) {
          const juz = config.currentSabaqJuz
          const juzStartPage = JUZ_START_PAGES[juz - 1]
          const juzEndPage = juz < 30 ? JUZ_START_PAGES[juz] - 1 : 604

          const memorizedSet = new Set(config.memorizedSurahIds)
          let lastMemorizedSurahInJuz = -1
          for (let s = 1; s <= 114; s++) {
            if (SURAH_START_PAGES[s] >= juzStartPage && SURAH_START_PAGES[s] <= juzEndPage) {
              if (memorizedSet.has(s)) {
                lastMemorizedSurahInJuz = s
              }
            }
          }

          if (lastMemorizedSurahInJuz > 0) {
            const nextSurah = lastMemorizedSurahInJuz + 1
            if (nextSurah <= 114 && SURAH_START_PAGES[nextSurah] <= juzEndPage) {
              const relativePage = SURAH_START_PAGES[nextSurah] - juzStartPage + 1
              set({ currentSabaqPage: relativePage })
            }
          }
        }

        // Generate session after state is saved, then sync to SQLite
        setTimeout(() => {
          get().generateToday()

          // Sync memorized surahs to hifzStore (SQLite)
          const surahIds = config.memorizedSurahIds ?? []
          const hifzStore = useHifzStore.getState()
          for (const surahId of surahIds) {
            const ch = chapters[surahId]
            if (ch) {
              hifzStore.markSurahMemorized(surahId, ch.versesCount, 'hafs')
            }
          }
          // Reload hifzStore progress
          hifzStore.loadProgress('hafs')
        }, 0)
      },

      generateToday: () => {
        const state = get()
        if (!state.setupComplete || (state.memorizedJuzNumbers.length === 0 && (!state.memorizedSurahIds || state.memorizedSurahIds.length === 0))) {
          set({ todaySession: null, studentLevel: null, dhorCycle: null })
          return
        }

        try {
          const memorizedJuz = buildMemorizedJuz(
            state.memorizedJuzNumbers,
            state.juzQualityScores,
          )

          const level = getStudentLevel(state.memorizedJuzNumbers.length)
          const dhorCycle = generateDhorCycle(memorizedJuz, level, state.memorizedSurahIds)

          const now = new Date()
          const sessionDate = now.toISOString().slice(0, 10)
          const dayOfWeek = now.getDay()
          const isActiveDay = computeIsActiveDay(dayOfWeek, state.activeDaysPerWeek, state.activeDayNumbers)

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
            sabaqPagesOverride: state.sabaqPagesOverride,
            memorizedSurahIds: state.memorizedSurahIds,
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

          // Detect level transition
          const prevLevel = state.previousLevel
          const isTransition = prevLevel !== null && prevLevel !== level
          const newPreviousLevel = prevLevel === null ? level : (isTransition ? level : prevLevel)

          set({
            studentLevel: level,
            todaySession,
            dhorCycle,
            previousLevel: newPreviousLevel,
            levelTransitionDetected: isTransition,
            sabaqUnit: null, // Reset while resolving
          })

          // Resolve sabaq to concrete ayah-bounded unit (async)
          if (todaySession.sabaq) {
            resolveSabaqUnit(todaySession, state.ayahBoundaryMode).then(unit => {
              set({ sabaqUnit: unit })
            }).catch(err => {
              console.error('[generateToday] Failed to resolve sabaq unit:', err)
            })
          }
        } catch (err) {
          console.error('[generateToday] Session generation failed:', err)
          set({ todaySession: null, studentLevel: null, dhorCycle: null })
        }
      },

      completeSession: (ratings, totalMinutes) => {
        const state = get()
        const today = new Date().toISOString().slice(0, 10)

        // 1. Update juzQualityScores using exponential moving average
        const updatedScores = { ...state.juzQualityScores }
        for (const [juzStr, rating] of Object.entries(ratings)) {
          const juz = Number(juzStr)
          const oldScore = updatedScores[juz] ?? 3.5
          updatedScores[juz] = oldScore * 0.3 + rating * 0.7
        }

        // 2. Build session record from todaySession
        const session = state.todaySession
        const sabaqPages = session?.sabaq
          ? session.sabaq.endPage - session.sabaq.startPage + 1
          : 0
        const sabqiPages = session?.sabqi
          ? session.sabqi.reduce((sum, s) => sum + (s.endPage - s.startPage + 1), 0)
          : 0
        const dhorPages = session?.dhor
          ? session.dhor.reduce((sum, d) => sum + (d.endPage - d.startPage + 1), 0)
          : 0

        const record: SessionRecord = {
          date: today,
          level: state.studentLevel ?? 1,
          sabaqPages,
          sabqiPages,
          dhorPages,
          ratings,
          totalMinutes,
        }

        // 3. Append to sessionHistory, cap at 90
        const newHistory = [...state.sessionHistory, record].slice(-90)

        // 4. Append to completedSessionDates, cap at 90
        const newDates = [...state.completedSessionDates, today].slice(-90)

        // 5. Increment dhorDayNumber
        const newDhorDay = state.dhorDayNumber + 1

        // 6. Update state
        set({
          juzQualityScores: updatedScores,
          sessionHistory: newHistory,
          completedSessionDates: newDates,
          dhorDayNumber: newDhorDay,
          lastSessionDate: today,
        })

        // 7. Regenerate session for next time
        setTimeout(() => get().generateToday(), 0)
      },

      getMissedDays: () => {
        const state = get()
        if (!state.lastSessionDate) return 0
        const last = new Date(state.lastSessionDate + 'T00:00:00')
        const now = new Date()
        const today = new Date(now.toISOString().slice(0, 10) + 'T00:00:00')
        const diffMs = today.getTime() - last.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        // If last session was yesterday (diff=1) or today (diff=0), no missed days
        return Math.max(0, diffDays - 1)
      },

      setSabaqPagesOverride: (pages) => {
        set({ sabaqPagesOverride: pages })
        // Regenerate session with new amount
        setTimeout(() => get().generateToday(), 0)
      },

      setAyahBoundaryMode: (mode) => {
        set({ ayahBoundaryMode: mode })
        // Re-resolve sabaq unit with new mode
        setTimeout(() => get().generateToday(), 0)
      },

      dismissLevelTransition: () => {
        set({ levelTransitionDetected: false })
      },

      resetSetup: () => {
        set({
          setupComplete: false,
          memorizedJuzNumbers: [],
          memorizedSurahIds: [],
          currentSabaqJuz: null,
          currentSabaqPage: 1,
          activeDaysPerWeek: 5,
          activeDayNumbers: [0, 1, 2, 3, 4],
          juzQualityScores: {},
          dhorDayNumber: 0,
          sabaqPagesOverride: null,
          ayahBoundaryMode: 'round_down' as AyahBoundaryMode,
          lastSessionDate: null,
          completedSessionDates: [],
          previousLevel: null,
          sessionHistory: [],
          studentLevel: null,
          todaySession: null,
          dhorCycle: null,
          levelTransitionDetected: false,
          sabaqUnit: null,
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
        memorizedSurahIds: state.memorizedSurahIds,
        currentSabaqJuz: state.currentSabaqJuz,
        currentSabaqPage: state.currentSabaqPage,
        activeDaysPerWeek: state.activeDaysPerWeek,
        activeDayNumbers: state.activeDayNumbers,
        juzQualityScores: state.juzQualityScores,
        dhorDayNumber: state.dhorDayNumber,
        sabaqPagesOverride: state.sabaqPagesOverride,
        ayahBoundaryMode: state.ayahBoundaryMode,
        lastSessionDate: state.lastSessionDate,
        completedSessionDates: state.completedSessionDates,
        previousLevel: state.previousLevel,
        sessionHistory: state.sessionHistory,
      }),
    },
  ),
)

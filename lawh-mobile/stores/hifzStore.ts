/**
 * Hifz Store - Reactive state for memorization tracking
 *
 * Uses Zustand with NO persist middleware -- SQLite is the persistence layer.
 * Every mutation writes to SQLite first (via hifzService), then updates store state.
 * This write-through pattern ensures consistency between UI state and database.
 */

import { create } from 'zustand'
import { hifzService } from '@/services/hifzService'
import type { Grade, SurahStatus, ReviewQueueItem } from '@/lib/sr/types'

interface HifzState {
  /** Aggregated status per surah (for 114-surah grid) */
  surahStatuses: SurahStatus[]
  /** Count of reviews due today or overdue */
  reviewDueCount: number
  /** Total memorized ayah count */
  totalMemorized: number
  /** Whether initial data has been loaded from SQLite */
  loaded: boolean
  /** Current review session ayahs */
  sessionAyahs: ReviewQueueItem[]

  // --- Actions ---

  /** Load all progress data from SQLite */
  loadProgress: (riwayah: string) => void
  /** Grade an ayah and refresh affected state */
  gradeAyah: (surahId: number, ayahNumber: number, riwayah: string, grade: Grade) => void
  /** Mark an ayah as memorized and refresh state */
  markMemorized: (surahId: number, ayahNumber: number, riwayah: string) => void
  /** Mark an ayah as in-progress and refresh state */
  markInProgress: (surahId: number, ayahNumber: number, riwayah: string) => void
  /** Load the review queue for a session */
  loadReviewQueue: (riwayah: string) => void
}

export const useHifzStore = create<HifzState>()((set) => ({
  surahStatuses: [],
  reviewDueCount: 0,
  totalMemorized: 0,
  loaded: false,
  sessionAyahs: [],

  loadProgress: (riwayah: string) => {
    hifzService.initHifzDb()
    const surahStatuses = hifzService.getSurahStatuses(riwayah)
    const reviewDueCount = hifzService.getReviewDueCount(riwayah)
    const totalMemorized = hifzService.getTotalMemorized(riwayah)
    set({ surahStatuses, reviewDueCount, totalMemorized, loaded: true })
  },

  gradeAyah: (surahId: number, ayahNumber: number, riwayah: string, grade: Grade) => {
    // Write-through: SQLite first
    hifzService.gradeAyah(surahId, ayahNumber, riwayah, grade)

    // Refresh affected state
    const surahStatuses = hifzService.getSurahStatuses(riwayah)
    const reviewDueCount = hifzService.getReviewDueCount(riwayah)
    const totalMemorized = hifzService.getTotalMemorized(riwayah)
    set({ surahStatuses, reviewDueCount, totalMemorized })
  },

  markMemorized: (surahId: number, ayahNumber: number, riwayah: string) => {
    // Write-through: SQLite first
    hifzService.markAyahMemorized(surahId, ayahNumber, riwayah)

    // Refresh affected state
    const surahStatuses = hifzService.getSurahStatuses(riwayah)
    const reviewDueCount = hifzService.getReviewDueCount(riwayah)
    const totalMemorized = hifzService.getTotalMemorized(riwayah)
    set({ surahStatuses, reviewDueCount, totalMemorized })
  },

  markInProgress: (surahId: number, ayahNumber: number, riwayah: string) => {
    // Write-through: SQLite first
    hifzService.markAyahInProgress(surahId, ayahNumber, riwayah)

    // Refresh affected state
    const surahStatuses = hifzService.getSurahStatuses(riwayah)
    set({ surahStatuses })
  },

  loadReviewQueue: (riwayah: string) => {
    const sessionAyahs = hifzService.getReviewQueue(riwayah)
    set({ sessionAyahs })
  },
}))

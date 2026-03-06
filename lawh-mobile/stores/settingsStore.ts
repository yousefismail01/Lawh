import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Riwayah } from '@/types/riwayah'
import { DEFAULT_RIWAYAH } from '@/types/riwayah'

type ContentsSortOrder = 'ascending' | 'descending' | 'revelation'
export type ReadingMode = 'mushaf' | 'arabic-cards' | 'translation-cards'
export type BannerTheme = 'bw' | 'classic' | 'blue' | 'pink'
export type PageDesign = 'fullscreen' | 'book'
export type LandscapeLayout = 'single' | 'double'

interface SettingsState {
  riwayah: Riwayah
  dailyGoalMinutes: number
  dailyGoalAyahs: number
  navigationMode: 'horizontal' | 'vertical'
  lastReadPage: number
  contentsSortOrder: ContentsSortOrder
  readingMode: ReadingMode
  tajweedEnabled: boolean
  showArabicVerse: boolean
  showTransliteration: boolean
  showTranslation: boolean
  arabicFontSize: number
  translationFontSize: number
  bannerTheme: BannerTheme
  pageDesign: PageDesign
  landscapeLayout: LandscapeLayout
  thematicHighlighting: boolean
  _hasHydrated: boolean
  setRiwayah: (riwayah: Riwayah) => void
  setGoals: (minutes: number, ayahs: number) => void
  setNavigationMode: (mode: 'horizontal' | 'vertical') => void
  setLastReadPage: (page: number) => void
  setContentsSortOrder: (order: ContentsSortOrder) => void
  setReadingMode: (mode: ReadingMode) => void
  setTajweedEnabled: (enabled: boolean) => void
  setShowArabicVerse: (show: boolean) => void
  setShowTransliteration: (show: boolean) => void
  setShowTranslation: (show: boolean) => void
  setArabicFontSize: (size: number) => void
  setTranslationFontSize: (size: number) => void
  setBannerTheme: (theme: BannerTheme) => void
  setPageDesign: (pageDesign: PageDesign) => void
  setLandscapeLayout: (landscapeLayout: LandscapeLayout) => void
  setThematicHighlighting: (thematicHighlighting: boolean) => void
  setHasHydrated: (hydrated: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      riwayah: DEFAULT_RIWAYAH,
      dailyGoalMinutes: 15,
      dailyGoalAyahs: 5,
      navigationMode: 'horizontal',
      lastReadPage: 1,
      contentsSortOrder: 'ascending',
      readingMode: 'mushaf',
      tajweedEnabled: true,
      showArabicVerse: true,
      showTransliteration: false,
      showTranslation: true,
      arabicFontSize: 26,
      translationFontSize: 15,
      bannerTheme: 'bw',
      pageDesign: 'fullscreen',
      landscapeLayout: 'double',
      thematicHighlighting: false,
      _hasHydrated: false,
      setRiwayah: (riwayah) => set({ riwayah }),
      setGoals: (dailyGoalMinutes, dailyGoalAyahs) => set({ dailyGoalMinutes, dailyGoalAyahs }),
      setNavigationMode: (navigationMode) => set({ navigationMode }),
      setLastReadPage: (lastReadPage) => set({ lastReadPage }),
      setContentsSortOrder: (contentsSortOrder) => set({ contentsSortOrder }),
      setReadingMode: (readingMode) => set({ readingMode }),
      setTajweedEnabled: (tajweedEnabled) => set({ tajweedEnabled }),
      setShowArabicVerse: (showArabicVerse) => set({ showArabicVerse }),
      setShowTransliteration: (showTransliteration) => set({ showTransliteration }),
      setShowTranslation: (showTranslation) => set({ showTranslation }),
      setArabicFontSize: (arabicFontSize) => set({ arabicFontSize }),
      setTranslationFontSize: (translationFontSize) => set({ translationFontSize }),
      setBannerTheme: (bannerTheme) => set({ bannerTheme }),
      setPageDesign: (pageDesign) => set({ pageDesign }),
      setLandscapeLayout: (landscapeLayout) => set({ landscapeLayout }),
      setThematicHighlighting: (thematicHighlighting) => set({ thematicHighlighting }),
      setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),
    }),
    {
      name: 'lawh-settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
      // Exclude _hasHydrated from persistence — it's runtime-only
      partialize: (state) => ({
        riwayah: state.riwayah,
        dailyGoalMinutes: state.dailyGoalMinutes,
        dailyGoalAyahs: state.dailyGoalAyahs,
        navigationMode: state.navigationMode,
        lastReadPage: state.lastReadPage,
        contentsSortOrder: state.contentsSortOrder,
        readingMode: state.readingMode,
        tajweedEnabled: state.tajweedEnabled,
        showArabicVerse: state.showArabicVerse,
        showTransliteration: state.showTransliteration,
        showTranslation: state.showTranslation,
        arabicFontSize: state.arabicFontSize,
        translationFontSize: state.translationFontSize,
        bannerTheme: state.bannerTheme,
        pageDesign: state.pageDesign,
        landscapeLayout: state.landscapeLayout,
        thematicHighlighting: state.thematicHighlighting,
      }),
    }
  )
)

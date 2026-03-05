import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Riwayah } from '@/types/riwayah'
import { DEFAULT_RIWAYAH } from '@/types/riwayah'

interface SettingsState {
  riwayah: Riwayah
  dailyGoalMinutes: number
  dailyGoalAyahs: number
  navigationMode: 'horizontal' | 'vertical'
  lastReadPage: number
  _hasHydrated: boolean
  setRiwayah: (riwayah: Riwayah) => void
  setGoals: (minutes: number, ayahs: number) => void
  setNavigationMode: (mode: 'horizontal' | 'vertical') => void
  setLastReadPage: (page: number) => void
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
      _hasHydrated: false,
      setRiwayah: (riwayah) => set({ riwayah }),
      setGoals: (dailyGoalMinutes, dailyGoalAyahs) => set({ dailyGoalMinutes, dailyGoalAyahs }),
      setNavigationMode: (navigationMode) => set({ navigationMode }),
      setLastReadPage: (lastReadPage) => set({ lastReadPage }),
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
      }),
    }
  )
)

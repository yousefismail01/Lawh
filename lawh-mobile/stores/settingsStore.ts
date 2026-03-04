import { create } from 'zustand'
import type { Riwayah } from '@/types/riwayah'
import { DEFAULT_RIWAYAH } from '@/types/riwayah'

interface SettingsState {
  riwayah: Riwayah
  dailyGoalMinutes: number
  dailyGoalAyahs: number
  setRiwayah: (riwayah: Riwayah) => void
  setGoals: (minutes: number, ayahs: number) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  riwayah: DEFAULT_RIWAYAH,
  dailyGoalMinutes: 15,
  dailyGoalAyahs: 5,
  setRiwayah: (riwayah) => set({ riwayah }),
  setGoals: (dailyGoalMinutes, dailyGoalAyahs) => set({ dailyGoalMinutes, dailyGoalAyahs }),
}))

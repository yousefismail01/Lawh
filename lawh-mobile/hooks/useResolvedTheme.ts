import { useColorScheme } from 'react-native'
import { useSettingsStore } from '@/stores/settingsStore'

export interface ResolvedTheme {
  isDark: boolean
  backgroundColor: string
  textColor: string
  secondaryTextColor: string
  separatorColor: string
}

export function useResolvedTheme(): ResolvedTheme {
  const systemScheme = useColorScheme()
  const appThemeMode = useSettingsStore((s) => s.appThemeMode)
  const lightVariant = useSettingsStore((s) => s.lightVariant)
  const darkVariant = useSettingsStore((s) => s.darkVariant)

  const isDark =
    appThemeMode === 'auto' ? systemScheme === 'dark' : appThemeMode === 'dark'

  const backgroundColor = isDark
    ? darkVariant === 'black'
      ? '#000000'
      : '#0A1628'
    : lightVariant === 'white'
      ? '#FFFFFF'
      : '#FAF6F0'

  const textColor = isDark ? '#FFFFFF' : '#000000'
  const secondaryTextColor = isDark ? '#999999' : '#666666'
  const separatorColor = isDark ? '#333333' : '#e0e0e0'

  return { isDark, backgroundColor, textColor, secondaryTextColor, separatorColor }
}

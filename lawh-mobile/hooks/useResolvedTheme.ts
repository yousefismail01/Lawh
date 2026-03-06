import { useColorScheme } from 'react-native'
import { useSettingsStore } from '@/stores/settingsStore'

export interface ResolvedTheme {
  isDark: boolean
  backgroundColor: string
  textColor: string
  secondaryTextColor: string
  separatorColor: string
  cardColor: string
  surfaceColor: string
  borderColor: string
  iconColor: string
  accentColor: string
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
      : '#1C1C1E'
    : lightVariant === 'white'
      ? '#FFFFFF'
      : '#FAF6F0'

  const textColor = isDark ? '#FFFFFF' : '#000000'
  const secondaryTextColor = isDark ? '#999999' : '#666666'
  const separatorColor = isDark ? '#333333' : '#e0e0e0'
  const cardColor = isDark ? '#1e1e1e' : '#f8f8f8'
  const surfaceColor = isDark ? '#2a2a2a' : '#f5f5f5'
  const borderColor = isDark ? '#333333' : '#e8e8e8'
  const iconColor = isDark ? '#cccccc' : '#333333'
  const accentColor = '#007AFF'

  return {
    isDark,
    backgroundColor,
    textColor,
    secondaryTextColor,
    separatorColor,
    cardColor,
    surfaceColor,
    borderColor,
    iconColor,
    accentColor,
  }
}

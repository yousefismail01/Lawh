import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSettingsStore } from '@/stores/settingsStore'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'

const THEME_MODE_LABELS: Record<string, string> = {
  auto: 'Auto',
  light: 'Light',
  dark: 'Dark',
}

export default function SettingsScreen() {
  const router = useRouter()
  const { backgroundColor, textColor, secondaryTextColor, cardColor, separatorColor, iconColor } = useResolvedTheme()
  const appThemeMode = useSettingsStore((s) => s.appThemeMode)
  const readingMode = useSettingsStore((s) => s.readingMode)

  const readingModeLabel =
    readingMode === 'mushaf'
      ? 'Mushaf'
      : readingMode === 'arabic-cards'
        ? 'Arabic Cards'
        : 'Translation Cards'

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor, borderBottomColor: separatorColor }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          {/* Quran row */}
          <Pressable
            style={styles.row}
            onPress={() => router.push('/(main)/quran-settings')}
          >
            <Ionicons name="book-outline" size={20} color={iconColor} style={styles.rowIcon} />
            <View style={styles.rowTextContainer}>
              <Text style={[styles.rowLabel, { color: textColor }]}>Quran</Text>
              <Text style={[styles.rowSubtitle, { color: secondaryTextColor }]}>{readingModeLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={secondaryTextColor} />
          </Pressable>

          <View style={[styles.separator, { backgroundColor: separatorColor }]} />

          {/* Theme row */}
          <Pressable
            style={styles.row}
            onPress={() => router.push('/(main)/theme-settings')}
          >
            <Ionicons name="color-palette-outline" size={20} color={iconColor} style={styles.rowIcon} />
            <View style={styles.rowTextContainer}>
              <Text style={[styles.rowLabel, { color: textColor }]}>Theme</Text>
              <Text style={[styles.rowSubtitle, { color: secondaryTextColor }]}>{THEME_MODE_LABELS[appThemeMode] ?? appThemeMode}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={secondaryTextColor} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  card: {
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowTextContainer: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 48,
  },
})

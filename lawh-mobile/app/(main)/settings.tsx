import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSettingsStore } from '@/stores/settingsStore'

const THEME_MODE_LABELS: Record<string, string> = {
  auto: 'Auto',
  light: 'Light',
  dark: 'Dark',
}

export default function SettingsScreen() {
  const router = useRouter()
  const appThemeMode = useSettingsStore((s) => s.appThemeMode)
  const readingMode = useSettingsStore((s) => s.readingMode)

  const readingModeLabel =
    readingMode === 'mushaf'
      ? 'Mushaf'
      : readingMode === 'arabic-cards'
        ? 'Arabic Cards'
        : 'Translation Cards'

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          {/* Quran row */}
          <Pressable
            style={styles.row}
            onPress={() => router.push('/(main)/quran-settings')}
          >
            <Ionicons name="book-outline" size={20} color="#333" style={styles.rowIcon} />
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Quran</Text>
              <Text style={styles.rowSubtitle}>{readingModeLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </Pressable>

          <View style={styles.separator} />

          {/* Theme row */}
          <Pressable
            style={styles.row}
            onPress={() => router.push('/(main)/theme-settings')}
          >
            <Ionicons name="color-palette-outline" size={20} color="#333" style={styles.rowIcon} />
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Theme</Text>
              <Text style={styles.rowSubtitle}>{THEME_MODE_LABELS[appThemeMode] ?? appThemeMode}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
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
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#f8f8f8',
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
    color: '#000',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e0e0e0',
    marginLeft: 48,
  },
})

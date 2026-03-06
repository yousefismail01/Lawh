import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  useSettingsStore,
  type AppThemeMode,
  type LightVariant,
  type DarkVariant,
} from '@/stores/settingsStore'

// --- Reusable row component ---

function SettingRow({
  icon,
  label,
  selected,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={20} color="#6B5D45" style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      {selected && <Ionicons name="checkmark" size={20} color="#4CAF50" />}
    </Pressable>
  )
}

function Separator() {
  return <View style={styles.separator} />
}

// --- Mode options ---

const MODE_OPTIONS: { key: AppThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'auto', label: 'Auto (System)', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
]

const LIGHT_OPTIONS: { key: LightVariant; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'white', label: 'White', icon: 'square-outline' },
  { key: 'parchment', label: 'Parchment', icon: 'albums-outline' },
]

const DARK_OPTIONS: { key: DarkVariant; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'black', label: 'True Black', icon: 'contrast-outline' },
  { key: 'navy', label: 'Navy', icon: 'boat-outline' },
]

// --- Main screen ---

export default function ThemeSettingsScreen() {
  const router = useRouter()

  const appThemeMode = useSettingsStore((s) => s.appThemeMode)
  const setAppThemeMode = useSettingsStore((s) => s.setAppThemeMode)
  const lightVariant = useSettingsStore((s) => s.lightVariant)
  const setLightVariant = useSettingsStore((s) => s.setLightVariant)
  const darkVariant = useSettingsStore((s) => s.darkVariant)
  const setDarkVariant = useSettingsStore((s) => s.setDarkVariant)

  const showLightStyle = appThemeMode === 'light' || appThemeMode === 'auto'
  const showDarkStyle = appThemeMode === 'dark' || appThemeMode === 'auto'

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color="#007AFF" />
          <Text style={styles.backText}>Settings</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Theme</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode selection */}
        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>APPEARANCE</Text>
        <View style={styles.card}>
          {MODE_OPTIONS.map((option, index) => (
            <View key={option.key}>
              {index > 0 && <Separator />}
              <SettingRow
                icon={option.icon}
                label={option.label}
                selected={appThemeMode === option.key}
                onPress={() => setAppThemeMode(option.key)}
              />
            </View>
          ))}
        </View>

        {/* Light style sub-card */}
        {showLightStyle && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>LIGHT STYLE</Text>
            <View style={styles.card}>
              {LIGHT_OPTIONS.map((option, index) => (
                <View key={option.key}>
                  {index > 0 && <Separator />}
                  <SettingRow
                    icon={option.icon}
                    label={option.label}
                    selected={lightVariant === option.key}
                    onPress={() => setLightVariant(option.key)}
                  />
                </View>
              ))}
            </View>
          </>
        )}

        {/* Dark style sub-card */}
        {showDarkStyle && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>DARK STYLE</Text>
            <View style={styles.card}>
              {DARK_OPTIONS.map((option, index) => (
                <View key={option.key}>
                  {index > 0 && <Separator />}
                  <SettingRow
                    icon={option.icon}
                    label={option.label}
                    selected={darkVariant === option.key}
                    onPress={() => setDarkVariant(option.key)}
                  />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2C2418',
  },
  headerSpacer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9C8D6E',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 20,
  },
  card: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 16,
    color: '#2C2418',
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E8E0D4',
    marginLeft: 16,
  },
})

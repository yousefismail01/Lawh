import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  useSettingsStore,
  type AppThemeMode,
  type LightVariant,
  type DarkVariant,
} from '@/stores/settingsStore'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'

// --- Reusable row component ---

function SettingRow({
  icon,
  label,
  selected,
  onPress,
  iconColor,
  textColor,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  selected: boolean
  onPress: () => void
  iconColor?: string
  textColor?: string
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={20} color={iconColor ?? '#6B5D45'} style={styles.rowIcon} />
      <Text style={[styles.rowLabel, textColor ? { color: textColor } : undefined]}>{label}</Text>
      {selected && <Ionicons name="checkmark" size={20} color="#4CAF50" />}
    </Pressable>
  )
}

function Separator({ color }: { color?: string }) {
  return <View style={[styles.separator, color ? { backgroundColor: color } : undefined]} />
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
  { key: 'gray', label: 'Dark Gray', icon: 'ellipse-outline' },
]

// --- Main screen ---

export default function ThemeSettingsScreen() {
  const router = useRouter()
  const { isDark, backgroundColor, textColor, secondaryTextColor, cardColor, separatorColor, iconColor, accentColor } = useResolvedTheme()

  const appThemeMode = useSettingsStore((s) => s.appThemeMode)
  const setAppThemeMode = useSettingsStore((s) => s.setAppThemeMode)
  const lightVariant = useSettingsStore((s) => s.lightVariant)
  const setLightVariant = useSettingsStore((s) => s.setLightVariant)
  const darkVariant = useSettingsStore((s) => s.darkVariant)
  const setDarkVariant = useSettingsStore((s) => s.setDarkVariant)

  const showLightStyle = appThemeMode === 'light' || appThemeMode === 'auto'
  const showDarkStyle = appThemeMode === 'dark' || appThemeMode === 'auto'

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={accentColor} />
          <Text style={[styles.backText, { color: accentColor }]}>Settings</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>Theme</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode selection */}
        <Text style={[styles.sectionTitle, { marginTop: 12, color: secondaryTextColor }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          {MODE_OPTIONS.map((option, index) => (
            <View key={option.key}>
              {index > 0 && <Separator color={separatorColor} />}
              <SettingRow
                icon={option.icon}
                label={option.label}
                selected={appThemeMode === option.key}
                onPress={() => setAppThemeMode(option.key)}
                iconColor={iconColor}
                textColor={textColor}
              />
            </View>
          ))}
        </View>

        {/* Light style sub-card */}
        {showLightStyle && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 12, color: secondaryTextColor }]}>LIGHT STYLE</Text>
            <View style={[styles.card, { backgroundColor: cardColor }]}>
              {LIGHT_OPTIONS.map((option, index) => (
                <View key={option.key}>
                  {index > 0 && <Separator color={separatorColor} />}
                  <SettingRow
                    icon={option.icon}
                    label={option.label}
                    selected={lightVariant === option.key}
                    onPress={() => setLightVariant(option.key)}
                    iconColor={iconColor}
                    textColor={textColor}
                  />
                </View>
              ))}
            </View>
          </>
        )}

        {/* Dark style sub-card */}
        {showDarkStyle && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 12, color: secondaryTextColor }]}>DARK STYLE</Text>
            <View style={[styles.card, { backgroundColor: cardColor }]}>
              {DARK_OPTIONS.map((option, index) => (
                <View key={option.key}>
                  {index > 0 && <Separator color={separatorColor} />}
                  <SettingRow
                    icon={option.icon}
                    label={option.label}
                    selected={darkVariant === option.key}
                    onPress={() => setDarkVariant(option.key)}
                    iconColor={iconColor}
                    textColor={textColor}
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

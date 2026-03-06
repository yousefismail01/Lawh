import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SvgXml } from 'react-native-svg'
import { useSettingsStore, type BannerTheme } from '@/stores/settingsStore'
import { buildOrnamentSvg, VECTOR_THEMES } from '@/components/mushaf/BlueSurahBanner'

// --- Reusable row component ---

function SettingRow({
  icon,
  label,
  selected,
  onPress,
  preview,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  selected: boolean
  onPress: () => void
  preview?: React.ReactNode
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      {preview ?? (
        <Ionicons name={icon} size={20} color="#6B5D45" style={styles.rowIcon} />
      )}
      <Text style={styles.rowLabel}>{label}</Text>
      {selected && <Ionicons name="checkmark" size={20} color="#4CAF50" />}
    </Pressable>
  )
}

function Separator() {
  return <View style={styles.separator} />
}

// --- Theme preview components ---

const SVG_PREVIEW_WIDTH = 160
const SVG_PREVIEW_HEIGHT = SVG_PREVIEW_WIDTH / (8240 / 1033)

function ThemePreview({ themeKey }: { themeKey: BannerTheme }) {
  if (themeKey === 'classic') {
    return (
      <View style={[styles.themePreviewContainer, { backgroundColor: '#2A3A2A' }]}>
        <Text style={styles.classicPreviewText}>header</Text>
      </View>
    )
  }

  const colors = VECTOR_THEMES[themeKey]
  if (!colors) return <View style={styles.themePreviewContainer} />

  const svgXml = buildOrnamentSvg(colors.outline, colors.base, colors.accent)
  return (
    <View style={styles.themePreviewContainer}>
      <SvgXml xml={svgXml} width={SVG_PREVIEW_WIDTH} height={SVG_PREVIEW_HEIGHT} />
    </View>
  )
}

// --- Theme options ---

const THEME_OPTIONS: { key: BannerTheme; label: string }[] = [
  { key: 'bw', label: 'Black and White' },
  { key: 'classic', label: 'Classic' },
  { key: 'blue', label: 'Blue' },
  { key: 'pink', label: 'Pink' },
]

// --- Main screen ---

export default function QuranSettingsScreen() {
  const router = useRouter()

  const navigationMode = useSettingsStore((s) => s.navigationMode)
  const setNavigationMode = useSettingsStore((s) => s.setNavigationMode)
  const pageDesign = useSettingsStore((s) => s.pageDesign)
  const setPageDesign = useSettingsStore((s) => s.setPageDesign)
  const landscapeLayout = useSettingsStore((s) => s.landscapeLayout)
  const setLandscapeLayout = useSettingsStore((s) => s.setLandscapeLayout)
  const bannerTheme = useSettingsStore((s) => s.bannerTheme)
  const setBannerTheme = useSettingsStore((s) => s.setBannerTheme)
  const thematicHighlighting = useSettingsStore((s) => s.thematicHighlighting)
  const setThematicHighlighting = useSettingsStore((s) => s.setThematicHighlighting)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color="#007AFF" />
          <Text style={styles.backText}>Settings</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Quran</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Scroll Direction */}
        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>SCROLL DIRECTION</Text>
        <View style={styles.card}>
          <SettingRow
            icon="swap-horizontal-outline"
            label="Horizontal"
            selected={navigationMode === 'horizontal'}
            onPress={() => setNavigationMode('horizontal')}
          />
          <Separator />
          <SettingRow
            icon="swap-vertical-outline"
            label="Vertical"
            selected={navigationMode === 'vertical'}
            onPress={() => setNavigationMode('vertical')}
          />
        </View>

        {/* Section 2: Page Design */}
        <Text style={styles.sectionTitle}>PAGE DESIGN</Text>
        <View style={styles.card}>
          <SettingRow
            icon="expand-outline"
            label="Fullscreen"
            selected={pageDesign === 'fullscreen'}
            onPress={() => setPageDesign('fullscreen')}
          />
          <Separator />
          <SettingRow
            icon="book-outline"
            label="Book"
            selected={pageDesign === 'book'}
            onPress={() => setPageDesign('book')}
          />
        </View>

        {/* Section 3: Landscape Layout */}
        <Text style={styles.sectionTitle}>LANDSCAPE LAYOUT</Text>
        <View style={styles.card}>
          <SettingRow
            icon="tablet-portrait-outline"
            label="Single"
            selected={landscapeLayout === 'single'}
            onPress={() => setLandscapeLayout('single')}
          />
          <Separator />
          <SettingRow
            icon="tablet-landscape-outline"
            label="Double"
            selected={landscapeLayout === 'double'}
            onPress={() => setLandscapeLayout('double')}
          />
        </View>

        {/* Section 4: Theme */}
        <Text style={styles.sectionTitle}>THEME</Text>
        <View style={styles.card}>
          {THEME_OPTIONS.map((option, index) => (
            <View key={option.key}>
              {index > 0 && <Separator />}
              <SettingRow
                icon="color-palette-outline"
                label={option.label}
                selected={bannerTheme === option.key}
                onPress={() => setBannerTheme(option.key)}
                preview={
                  <View style={styles.themePreviewWrapper}>
                    <ThemePreview themeKey={option.key} />
                  </View>
                }
              />
            </View>
          ))}
        </View>

        {/* Section 5: Thematic Highlighting */}
        <Text style={styles.sectionTitle}>THEMATIC HIGHLIGHTING</Text>
        <View style={styles.card}>
          <View style={styles.highlightRow}>
            <Ionicons name="color-wand-outline" size={20} color="#6B5D45" style={styles.rowIcon} />
            <View style={styles.highlightTextContainer}>
              <Text style={styles.rowLabel}>Thematic Highlighting</Text>
              <Text style={styles.highlightDescription}>
                Highlight verses on the same topic to help with memorization
              </Text>
            </View>
            <Switch
              value={thematicHighlighting}
              onValueChange={setThematicHighlighting}
              trackColor={{ false: '#D4C9B8', true: '#4CAF50' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#F5F0E8',
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
    backgroundColor: '#FFFFFF',
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
  // Theme preview
  themePreviewWrapper: {
    marginRight: 12,
  },
  themePreviewContainer: {
    width: 80,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E0D4',
    justifyContent: 'center',
  },
  classicPreviewText: {
    fontFamily: 'QuranCommon',
    fontSize: 28,
    color: '#C9A84C',
    textAlign: 'center',
    includeFontPadding: false,
  },
  // Thematic highlighting
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  highlightTextContainer: {
    flex: 1,
  },
  highlightDescription: {
    fontSize: 13,
    color: '#9C8D6E',
    marginTop: 2,
  },
})

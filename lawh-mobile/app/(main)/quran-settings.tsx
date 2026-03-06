import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SvgXml } from 'react-native-svg'
import { useSettingsStore, type BannerTheme } from '@/stores/settingsStore'
import { buildOrnamentSvg, VECTOR_THEMES } from '@/components/mushaf/BlueSurahBanner'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'

// --- Reusable row component ---

function SettingRow({
  icon,
  label,
  selected,
  onPress,
  preview,
  iconColor,
  textColor,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  selected: boolean
  onPress: () => void
  preview?: React.ReactNode
  iconColor?: string
  textColor?: string
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      {preview ?? (
        <Ionicons name={icon} size={20} color={iconColor ?? '#6B5D45'} style={styles.rowIcon} />
      )}
      <Text style={[styles.rowLabel, textColor ? { color: textColor } : undefined]}>{label}</Text>
      {selected && <Ionicons name="checkmark" size={20} color="#4CAF50" />}
    </Pressable>
  )
}

function Separator({ color }: { color?: string }) {
  return <View style={[styles.separator, color ? { backgroundColor: color } : undefined]} />
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
  const { isDark, backgroundColor, textColor, secondaryTextColor, cardColor, separatorColor, iconColor, accentColor } = useResolvedTheme()

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
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={accentColor} />
          <Text style={[styles.backText, { color: accentColor }]}>Settings</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>Quran</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Scroll Direction */}
        <Text style={[styles.sectionTitle, { marginTop: 12, color: secondaryTextColor }]}>SCROLL DIRECTION</Text>
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <SettingRow
            icon="swap-horizontal-outline"
            label="Horizontal"
            selected={navigationMode === 'horizontal'}
            onPress={() => setNavigationMode('horizontal')}
            iconColor={iconColor}
            textColor={textColor}
          />
          <Separator color={separatorColor} />
          <SettingRow
            icon="swap-vertical-outline"
            label="Vertical"
            selected={navigationMode === 'vertical'}
            onPress={() => setNavigationMode('vertical')}
            iconColor={iconColor}
            textColor={textColor}
          />
        </View>

        {/* Section 2: Page Design */}
        <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>PAGE DESIGN</Text>
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <SettingRow
            icon="expand-outline"
            label="Fullscreen"
            selected={pageDesign === 'fullscreen'}
            onPress={() => setPageDesign('fullscreen')}
            iconColor={iconColor}
            textColor={textColor}
          />
          <Separator color={separatorColor} />
          <SettingRow
            icon="book-outline"
            label="Book"
            selected={pageDesign === 'book'}
            onPress={() => setPageDesign('book')}
            iconColor={iconColor}
            textColor={textColor}
          />
        </View>

        {/* Section 3: Landscape Layout */}
        <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>LANDSCAPE LAYOUT</Text>
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <SettingRow
            icon="tablet-portrait-outline"
            label="Single"
            selected={landscapeLayout === 'single'}
            onPress={() => setLandscapeLayout('single')}
            iconColor={iconColor}
            textColor={textColor}
          />
          <Separator color={separatorColor} />
          <SettingRow
            icon="tablet-landscape-outline"
            label="Double"
            selected={landscapeLayout === 'double'}
            onPress={() => setLandscapeLayout('double')}
            iconColor={iconColor}
            textColor={textColor}
          />
        </View>

        {/* Section 4: Theme */}
        <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>BANNER STYLE</Text>
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          {THEME_OPTIONS.map((option, index) => (
            <View key={option.key}>
              {index > 0 && <Separator color={separatorColor} />}
              <SettingRow
                icon="color-palette-outline"
                label={option.label}
                selected={bannerTheme === option.key}
                onPress={() => setBannerTheme(option.key)}
                iconColor={iconColor}
                textColor={textColor}
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
        <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>THEMATIC HIGHLIGHTING</Text>
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <View style={styles.highlightRow}>
            <Ionicons name="color-wand-outline" size={20} color={iconColor} style={styles.rowIcon} />
            <View style={styles.highlightTextContainer}>
              <Text style={[styles.rowLabel, { color: textColor }]}>Thematic Highlighting</Text>
              <Text style={[styles.highlightDescription, { color: secondaryTextColor }]}>
                Highlight verses on the same topic to help with memorization
              </Text>
            </View>
            <Switch
              value={thematicHighlighting}
              onValueChange={setThematicHighlighting}
              trackColor={{ false: isDark ? '#555' : '#D4C9B8', true: '#4CAF50' }}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backText: {
    fontSize: 16,
    marginLeft: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
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
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 20,
  },
  card: {
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
    marginTop: 2,
  },
})

import React from 'react'
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  useColorScheme,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSettingsStore, type ReadingMode } from '@/stores/settingsStore'

interface LayoutSelectorPopoverProps {
  visible: boolean
  onClose: () => void
}

const MODE_OPTIONS: {
  mode: ReadingMode
  label: string
  subtitle: string
  icon: string
}[] = [
  { mode: 'mushaf', label: 'Book', subtitle: 'Madani Mushaf (1441)', icon: '\u{1F4D6}' },
  { mode: 'arabic-cards', label: 'Quran Text', subtitle: 'Resizable Quran Text', icon: '\u{1F4C4}' },
  { mode: 'translation-cards', label: 'Translation / Transliteration', subtitle: 'Sahih International', icon: '\u{1F4AC}' },
]

const LayoutSelectorPopoverInner = function LayoutSelectorPopoverInner({
  visible,
  onClose,
}: LayoutSelectorPopoverProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const insets = useSafeAreaInsets()

  const readingMode = useSettingsStore((s) => s.readingMode)
  const setReadingMode = useSettingsStore((s) => s.setReadingMode)

  const bgColor = isDark ? '#1c1c1e' : '#ffffff'
  const textColor = isDark ? '#ffffff' : '#000000'
  const subtitleColor = isDark ? '#8e8e93' : '#8e8e93'
  const sectionLabelColor = isDark ? '#8e8e93' : '#6d6d72'
  const optionBg = isDark ? '#2c2c2e' : '#f2f2f7'
  const selectedBorder = isDark ? '#ffffff' : '#000000'
  const radioFill = isDark ? '#ffffff' : '#000000'
  const chevronColor = isDark ? '#48484a' : '#c7c7cc'
  const dividerColor = isDark ? '#38383a' : '#e5e5ea'

  const handleModeSelect = (mode: ReadingMode) => {
    setReadingMode(mode)
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: bgColor, paddingBottom: insets.bottom + 16 }]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* Title bar */}
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: textColor }]}>Mushaf Layout</Text>
              <Pressable onPress={onClose} style={styles.closeButton} hitSlop={12}>
                <Text style={[styles.closeIcon, { color: subtitleColor }]}>{'\u2715'}</Text>
              </Pressable>
            </View>

            {/* Section: Reading Layout */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: sectionLabelColor }]}>READING LAYOUT</Text>
              <Text style={[styles.sectionSubtitle, { color: subtitleColor }]}>
                Select how you wish to read the Quran.
              </Text>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {MODE_OPTIONS.map((opt) => {
                const isActive = readingMode === opt.mode
                return (
                  <Pressable
                    key={opt.mode}
                    style={[
                      styles.optionRow,
                      {
                        backgroundColor: optionBg,
                        borderColor: isActive ? selectedBorder : 'transparent',
                        borderWidth: isActive ? 1.5 : 1.5,
                      },
                    ]}
                    onPress={() => handleModeSelect(opt.mode)}
                    accessibilityLabel={`${opt.label} reading mode`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={styles.optionIcon}>{opt.icon}</Text>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionLabel, { color: textColor }]}>{opt.label}</Text>
                      <Text style={[styles.optionSubtitle, { color: subtitleColor }]}>{opt.subtitle}</Text>
                    </View>
                    {/* Radio button */}
                    <View style={[styles.radio, { borderColor: isActive ? radioFill : subtitleColor }]}>
                      {isActive && <View style={[styles.radioFill, { backgroundColor: radioFill }]} />}
                    </View>
                  </Pressable>
                )
              })}
            </View>

            {/* Section: Mushaf Layout and Font (placeholder for future) */}
            <Pressable style={[styles.footerRow, { borderTopColor: dividerColor }]}>
              <View style={styles.footerTextContainer}>
                <Text style={[styles.sectionLabel, { color: sectionLabelColor }]}>MUSHAF LAYOUT AND FONT</Text>
                <Text style={[styles.sectionSubtitle, { color: subtitleColor }]}>
                  Choose the different Mushaf you wish to use.
                </Text>
              </View>
              <Text style={[styles.chevron, { color: chevronColor }]}>{'\u203A'}</Text>
            </Pressable>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  )
}

export const LayoutSelectorPopover = React.memo(LayoutSelectorPopoverInner)

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  optionsContainer: {
    gap: 8,
    marginBottom: 24,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  optionIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionSubtitle: {
    fontSize: 13,
    marginTop: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioFill: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
  },
  footerTextContainer: {
    flex: 1,
  },
  chevron: {
    fontSize: 28,
    fontWeight: '300',
    marginLeft: 8,
  },
})

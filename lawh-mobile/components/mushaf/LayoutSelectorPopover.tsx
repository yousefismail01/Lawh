import React from 'react'
import {
  View,
  Text,
  Pressable,
  Switch,
  Modal,
  StyleSheet,
  useColorScheme,
} from 'react-native'
import { useSettingsStore, type ReadingMode } from '@/stores/settingsStore'

interface LayoutSelectorPopoverProps {
  visible: boolean
  onClose: () => void
}

const MODE_OPTIONS: { mode: ReadingMode; label: string; icon: string }[] = [
  { mode: 'mushaf', label: 'Mushaf', icon: '\u{1F4D6}' },
  { mode: 'arabic-cards', label: 'Arabic', icon: '\u{1F4C4}' },
  { mode: 'translation-cards', label: 'Translation', icon: '\u{1F310}' },
]

const LayoutSelectorPopoverInner = function LayoutSelectorPopoverInner({
  visible,
  onClose,
}: LayoutSelectorPopoverProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const readingMode = useSettingsStore((s) => s.readingMode)
  const tajweedEnabled = useSettingsStore((s) => s.tajweedEnabled)
  const setReadingMode = useSettingsStore((s) => s.setReadingMode)
  const setTajweedEnabled = useSettingsStore((s) => s.setTajweedEnabled)

  const bgColor = isDark ? '#2a241c' : '#faf3e0'
  const textColor = isDark ? '#e8e0d0' : '#1c1812'
  const activeBg = isDark ? '#c8a84e' : '#d4a843'
  const activeText = isDark ? '#1c1812' : '#fff'
  const inactiveBg = isDark ? 'rgba(200, 168, 78, 0.12)' : 'rgba(0, 0, 0, 0.05)'
  const borderColor = isDark ? 'rgba(200, 168, 78, 0.2)' : 'rgba(0, 0, 0, 0.1)'
  const labelColor = isDark ? '#b0a890' : '#6b5c3e'

  const handleModeSelect = (mode: ReadingMode) => {
    setReadingMode(mode)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.anchorBottom}>
          <Pressable
            style={[styles.popover, { backgroundColor: bgColor, borderColor }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Mode buttons */}
            {MODE_OPTIONS.map((opt) => {
              const isActive = readingMode === opt.mode
              return (
                <Pressable
                  key={opt.mode}
                  style={[
                    styles.modeButton,
                    {
                      backgroundColor: isActive ? activeBg : inactiveBg,
                    },
                  ]}
                  onPress={() => handleModeSelect(opt.mode)}
                  accessibilityLabel={`${opt.label} reading mode`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={styles.modeIcon}>{opt.icon}</Text>
                  <Text
                    style={[
                      styles.modeLabel,
                      { color: isActive ? activeText : textColor },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              )
            })}

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            {/* Tajweed toggle */}
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: labelColor }]}>
                Tajweed Colors
              </Text>
              <Switch
                value={tajweedEnabled}
                onValueChange={setTajweedEnabled}
                trackColor={{
                  false: isDark ? '#555' : '#ccc',
                  true: isDark ? '#c8a84e' : '#d4a843',
                }}
                thumbColor="#fff"
              />
            </View>
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
    justifyContent: 'flex-end',
  },
  anchorBottom: {
    paddingHorizontal: 16,
    paddingBottom: 160, // positioned above footer
  },
  popover: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 12,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginVertical: 3,
  },
  modeIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
    marginHorizontal: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
})

import React, { useCallback, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Switch,
  StyleSheet,
  useColorScheme,
  LayoutChangeEvent,
  GestureResponderEvent,
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

/* ---------- Toggle Row ---------- */

interface ToggleRowProps {
  label: string
  value: boolean
  onValueChange: (v: boolean) => void
  disabled?: boolean
}

function ToggleRow({ label, value, onValueChange, disabled }: ToggleRowProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const textColor = isDark ? '#ffffff' : '#000000'

  return (
    <View style={innerStyles.toggleRow}>
      <Text style={[innerStyles.toggleLabel, { color: textColor, opacity: disabled ? 0.4 : 1 }]}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: isDark ? '#39393d' : '#e9e9ea', true: '#34c759' }}
        thumbColor="#ffffff"
      />
    </View>
  )
}

/* ---------- Font Size Slider ---------- */

interface FontSizeSliderProps {
  value: number
  onValueChange: (v: number) => void
  steps: number[]
  label: string
  isArabic?: boolean
}

function FontSizeSlider({ value, onValueChange, steps, label, isArabic }: FontSizeSliderProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const textColor = isDark ? '#ffffff' : '#000000'
  const trackColor = isDark ? '#48484a' : '#d1d1d6'
  const dotInactiveColor = isDark ? '#636366' : '#c7c7cc'
  const dotActiveColor = isDark ? '#ffffff' : '#000000'
  const labelColor = isDark ? '#8e8e93' : '#6d6d72'

  const trackWidthRef = useRef(0)

  const activeIndex = steps.indexOf(value)
  const currentIndex = activeIndex >= 0 ? activeIndex : 0

  const handleTrackLayout = useCallback((e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width
  }, [])

  const handleTrackPress = useCallback(
    (e: GestureResponderEvent) => {
      const x = e.nativeEvent.locationX
      const width = trackWidthRef.current
      if (width <= 0) return

      const ratio = x / width
      const idx = Math.round(ratio * (steps.length - 1))
      const clamped = Math.max(0, Math.min(steps.length - 1, idx))
      onValueChange(steps[clamped])
    },
    [steps, onValueChange]
  )

  const indicatorSmall = isArabic ? '\u0627\u0644\u0644\u0647' : 'Aa'
  const indicatorLarge = isArabic ? '\u0627\u0644\u0644\u0647' : 'Aa'
  const indicatorFontFamily = isArabic ? 'KFGQPCHafs' : undefined

  return (
    <View style={innerStyles.sliderContainer}>
      <Text style={[innerStyles.sliderLabel, { color: labelColor }]}>{label}</Text>
      <View style={innerStyles.sliderRow}>
        {/* Small indicator */}
        <Text
          style={[
            innerStyles.sliderIndicator,
            {
              fontSize: 12,
              color: textColor,
              fontFamily: indicatorFontFamily,
            },
          ]}
        >
          {indicatorSmall}
        </Text>

        {/* Track */}
        <Pressable
          style={innerStyles.sliderTrack}
          onLayout={handleTrackLayout}
          onPress={handleTrackPress}
        >
          {/* Background line */}
          <View style={[innerStyles.sliderTrackLine, { backgroundColor: trackColor }]} />
          {/* Step dots */}
          {steps.map((s, i) => {
            const isActive = i === currentIndex
            return (
              <View
                key={s}
                style={[
                  innerStyles.sliderDot,
                  {
                    left: `${(i / (steps.length - 1)) * 100}%`,
                    width: isActive ? 16 : 8,
                    height: isActive ? 16 : 8,
                    borderRadius: isActive ? 8 : 4,
                    backgroundColor: isActive ? dotActiveColor : dotInactiveColor,
                    marginLeft: isActive ? -8 : -4,
                    marginTop: isActive ? -8 : -4,
                  },
                ]}
              />
            )
          })}
        </Pressable>

        {/* Large indicator */}
        <Text
          style={[
            innerStyles.sliderIndicator,
            {
              fontSize: 20,
              color: textColor,
              fontFamily: indicatorFontFamily,
            },
          ]}
        >
          {indicatorLarge}
        </Text>
      </View>
    </View>
  )
}

/* ---------- Divider ---------- */

function Divider({ color }: { color: string }) {
  return <View style={[innerStyles.divider, { backgroundColor: color }]} />
}

/* ---------- Main Component ---------- */

const ARABIC_STEPS = [18, 20, 22, 24, 26, 28, 30, 32, 34]
const TRANSLATION_STEPS = [12, 14, 15, 16, 18, 20, 22, 24]

const LayoutSelectorPopoverInner = function LayoutSelectorPopoverInner({
  visible,
  onClose,
}: LayoutSelectorPopoverProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const insets = useSafeAreaInsets()

  const readingMode = useSettingsStore((s) => s.readingMode)
  const setReadingMode = useSettingsStore((s) => s.setReadingMode)
  const showArabicVerse = useSettingsStore((s) => s.showArabicVerse)
  const setShowArabicVerse = useSettingsStore((s) => s.setShowArabicVerse)
  const showTransliteration = useSettingsStore((s) => s.showTransliteration)
  const setShowTransliteration = useSettingsStore((s) => s.setShowTransliteration)
  const showTranslation = useSettingsStore((s) => s.showTranslation)
  const setShowTranslation = useSettingsStore((s) => s.setShowTranslation)
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize)
  const setArabicFontSize = useSettingsStore((s) => s.setArabicFontSize)
  const translationFontSize = useSettingsStore((s) => s.translationFontSize)
  const setTranslationFontSize = useSettingsStore((s) => s.setTranslationFontSize)

  const bgColor = isDark ? '#1c1c1e' : '#ffffff'
  const textColor = isDark ? '#ffffff' : '#000000'
  const subtitleColor = isDark ? '#8e8e93' : '#8e8e93'
  const sectionLabelColor = isDark ? '#8e8e93' : '#6d6d72'
  const optionBg = isDark ? '#2c2c2e' : '#f2f2f7'
  const selectedBorder = isDark ? '#ffffff' : '#000000'
  const radioFill = isDark ? '#ffffff' : '#000000'
  const chevronColor = isDark ? '#48484a' : '#c7c7cc'
  const dividerColor = isDark ? '#38383a' : '#e5e5ea'

  const isCardMode = readingMode !== 'mushaf'

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
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              style={{ maxHeight: 600 }}
            >
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

              {/* Reading Options (card modes only) */}
              {isCardMode && (
                <>
                  {/* Arabic Verse Section */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: sectionLabelColor }]}>
                      ARABIC VERSE
                    </Text>
                  </View>
                  <View style={[innerStyles.card, { backgroundColor: optionBg }]}>
                    <ToggleRow
                      label="Arabic Verse"
                      value={showArabicVerse}
                      onValueChange={setShowArabicVerse}
                    />
                    <Divider color={dividerColor} />
                    <FontSizeSlider
                      label="Font Size \u2014 Quranic Arabic"
                      value={arabicFontSize}
                      onValueChange={setArabicFontSize}
                      steps={ARABIC_STEPS}
                      isArabic
                    />
                  </View>

                  {/* Transliteration Section */}
                  <View style={[styles.section, { marginTop: 20 }]}>
                    <Text style={[styles.sectionLabel, { color: sectionLabelColor }]}>
                      TRANSLITERATION
                    </Text>
                  </View>
                  <View style={[innerStyles.card, { backgroundColor: optionBg }]}>
                    <ToggleRow
                      label="Transliteration"
                      value={showTransliteration}
                      onValueChange={setShowTransliteration}
                    />
                  </View>

                  {/* Translation Section */}
                  <View style={[styles.section, { marginTop: 20 }]}>
                    <Text style={[styles.sectionLabel, { color: sectionLabelColor }]}>
                      TRANSLATION
                    </Text>
                  </View>
                  <View style={[innerStyles.card, { backgroundColor: optionBg }]}>
                    <ToggleRow
                      label="Translation"
                      value={showTranslation}
                      onValueChange={setShowTranslation}
                    />
                    <Divider color={dividerColor} />
                    {/* Translation source row (non-interactive) */}
                    <View style={innerStyles.translationSourceRow}>
                      <Text style={[innerStyles.translationSourceLabel, { color: textColor }]}>
                        Translation
                      </Text>
                      <Text style={[innerStyles.translationSourceValue, { color: subtitleColor }]}>
                        Sahih International {'\u203A'}
                      </Text>
                    </View>
                    <Divider color={dividerColor} />
                    <FontSizeSlider
                      label="Font Size \u2014 Translation"
                      value={translationFontSize}
                      onValueChange={setTranslationFontSize}
                      steps={TRANSLATION_STEPS}
                    />
                  </View>
                </>
              )}

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
            </ScrollView>
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
    marginTop: 20,
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

const innerStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  sliderContainer: {
    paddingVertical: 12,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderIndicator: {
    textAlign: 'center',
    minWidth: 24,
  },
  sliderTrack: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
  },
  sliderTrackLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 1.5,
  },
  sliderDot: {
    position: 'absolute',
    top: '50%',
  },
  translationSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  translationSourceLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  translationSourceValue: {
    fontSize: 15,
  },
})

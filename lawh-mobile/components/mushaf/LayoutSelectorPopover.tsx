import React, { useCallback, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Switch,
  StyleSheet,
} from 'react-native'
import Slider from '@react-native-community/slider'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSettingsStore, type ReadingMode } from '@/stores/settingsStore'
import { TajweedInfoSheet } from './TajweedInfoSheet'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'

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

const ToggleRow = React.memo(function ToggleRow({ label, value, onValueChange, disabled }: ToggleRowProps) {
  const { isDark } = useResolvedTheme()
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
})

/* ---------- Font Size Slider ---------- */

interface FontSizeSliderProps {
  value: number
  onValueChange: (v: number) => void
  min: number
  max: number
  step: number
  label: string
  isArabic?: boolean
}

const FontSizeSlider = React.memo(function FontSizeSlider({ value, onValueChange, min, max, step, label, isArabic }: FontSizeSliderProps) {
  const { isDark } = useResolvedTheme()
  const textColor = isDark ? '#ffffff' : '#000000'
  const labelColor = isDark ? '#8e8e93' : '#6d6d72'
  const trackTint = isDark ? '#48484a' : '#d1d1d6'
  const thumbTint = isDark ? '#ffffff' : '#000000'

  const lastCommitted = useRef(value)

  const handleValueChange = useCallback(
    (v: number) => {
      const snapped = Math.round(v / step) * step
      const clamped = Math.max(min, Math.min(max, snapped))
      if (clamped !== lastCommitted.current) {
        lastCommitted.current = clamped
        onValueChange(clamped)
      }
    },
    [min, max, step, onValueChange]
  )

  const indicatorSmall = isArabic ? '\u0627\u0644\u0644\u0647' : 'Aa'
  const indicatorLarge = isArabic ? '\u0627\u0644\u0644\u0647' : 'Aa'
  const indicatorFontFamily = isArabic ? 'KFGQPCHafs' : undefined

  return (
    <View style={innerStyles.sliderContainer}>
      <Text style={[innerStyles.sliderLabel, { color: labelColor }]}>{label}</Text>
      <View style={innerStyles.sliderRow}>
        <Text
          style={[
            innerStyles.sliderIndicator,
            { fontSize: 12, color: textColor, fontFamily: indicatorFontFamily },
          ]}
        >
          {indicatorSmall}
        </Text>

        <Slider
          style={innerStyles.slider}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={value}
          onValueChange={handleValueChange}
          minimumTrackTintColor={thumbTint}
          maximumTrackTintColor={trackTint}
          thumbTintColor={thumbTint}
        />

        <Text
          style={[
            innerStyles.sliderIndicator,
            { fontSize: 20, color: textColor, fontFamily: indicatorFontFamily },
          ]}
        >
          {indicatorLarge}
        </Text>
      </View>
    </View>
  )
})

/* ---------- Divider ---------- */

function Divider({ color }: { color: string }) {
  return <View style={[innerStyles.divider, { backgroundColor: color }]} />
}

/* ---------- Main Component ---------- */


const LayoutSelectorPopoverInner = function LayoutSelectorPopoverInner({
  visible,
  onClose,
}: LayoutSelectorPopoverProps) {
  const { isDark } = useResolvedTheme()
  const insets = useSafeAreaInsets()
  const [tajweedInfoVisible, setTajweedInfoVisible] = useState(false)

  const readingMode = useSettingsStore((s) => s.readingMode)
  const setReadingMode = useSettingsStore((s) => s.setReadingMode)
  const tajweedEnabled = useSettingsStore((s) => s.tajweedEnabled)
  const setTajweedEnabled = useSettingsStore((s) => s.setTajweedEnabled)
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
      <View style={styles.backdrop}>
        {/* Tappable backdrop area above the sheet */}
        <Pressable style={styles.backdropTap} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: bgColor, paddingBottom: insets.bottom + 16 }]}>
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

              {/* Tajweed toggle — available in all modes */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: sectionLabelColor }]}>
                  TAJWEED
                </Text>
              </View>
              <View style={[innerStyles.card, { backgroundColor: optionBg }]}>
                <View style={innerStyles.toggleRow}>
                  <View style={innerStyles.tajweedLabelRow}>
                    <Text style={[innerStyles.toggleLabel, { color: textColor }]}>
                      Tajweed Colors
                    </Text>
                    <Pressable
                      onPress={() => setTajweedInfoVisible(true)}
                      hitSlop={10}
                      style={innerStyles.infoButton}
                    >
                      <Text style={[innerStyles.infoIcon, { color: subtitleColor }]}>
                        {'\u24D8'}
                      </Text>
                    </Pressable>
                  </View>
                  <Switch
                    value={tajweedEnabled}
                    onValueChange={setTajweedEnabled}
                    trackColor={{ false: isDark ? '#39393d' : '#e9e9ea', true: '#34c759' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>

              <TajweedInfoSheet
                visible={tajweedInfoVisible}
                onClose={() => setTajweedInfoVisible(false)}
              />

              {/* Reading Options — Quran Text mode: Arabic font size only */}
              {readingMode === 'arabic-cards' && (
                <>
                  <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: sectionLabelColor }]}>
                      ARABIC VERSE
                    </Text>
                  </View>
                  <View style={[innerStyles.card, { backgroundColor: optionBg }]}>
                    <FontSizeSlider
                      label="Font Size \u2014 Quranic Arabic"
                      value={arabicFontSize}
                      onValueChange={setArabicFontSize}
                      min={18}
                      max={34}
                      step={2}
                      isArabic
                    />
                  </View>
                </>
              )}

              {/* Reading Options — Translation mode: full options */}
              {readingMode === 'translation-cards' && (
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
                      min={18}
                      max={34}
                      step={2}
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
                      min={12}
                      max={24}
                      step={1}
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
        </View>
      </View>
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
  backdropTap: {
    flex: 1,
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
  slider: {
    flex: 1,
    height: 32,
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
  tajweedLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoButton: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: {
    fontSize: 16,
  },
})

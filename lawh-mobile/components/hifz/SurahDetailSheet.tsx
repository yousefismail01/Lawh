/**
 * SurahDetailSheet - Half-height bottom sheet showing per-ayah hifz detail.
 *
 * Opens when user taps a surah card in the grid. Displays:
 * - Surah name (Arabic + transliteration)
 * - Overall memorization percentage
 * - Scrollable list of AyahProgressRow components
 * - Action buttons: Start Review, Mark All Memorized
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { hifzService } from '@/services/hifzService'
import type { AyahProgressRow as AyahProgressRowData } from '@/services/hifzService'
import { useHifzStore } from '@/stores/hifzStore'
import { quranService } from '@/services/quranService'
import { AyahProgressRow } from './AyahProgressRow'

const SCREEN_HEIGHT = Dimensions.get('window').height

interface SurahDetailSheetProps {
  visible: boolean
  surahId: number | null
  onClose: () => void
  isDark: boolean
}

function buildColors(isDark: boolean) {
  return {
    bg: isDark ? '#1a1a1a' : '#fff',
    surface: isDark ? '#2a2a2a' : '#f5f5f5',
    text: isDark ? '#fff' : '#1a1a1a',
    muted: isDark ? '#888' : '#999',
    border: isDark ? '#333' : '#e8e8e8',
    accent: isDark ? '#4ade80' : '#16a34a',
    accentBlue: isDark ? '#60a5fa' : '#2563eb',
    backdrop: 'rgba(0,0,0,0.5)',
  }
}

export function SurahDetailSheet({ visible, surahId, onClose, isDark }: SurahDetailSheetProps) {
  const router = useRouter()
  const colors = buildColors(isDark)
  const markMemorized = useHifzStore((s) => s.markMemorized)

  const [ayahRows, setAyahRows] = useState<AyahProgressRowData[]>([])
  const [surahName, setSurahName] = useState<{ arabic: string; transliteration: string }>({
    arabic: '',
    transliteration: '',
  })

  useEffect(() => {
    if (!visible || !surahId) {
      setAyahRows([])
      return
    }
    const rows = hifzService.getAyahProgress(surahId, 'hafs')
    setAyahRows(rows)

    // Load surah metadata
    quranService.getSurah(surahId).then((s) => {
      if (s) {
        setSurahName({ arabic: s.nameArabic, transliteration: s.nameTransliteration })
      }
    })
  }, [visible, surahId])

  const memorizedCount = useMemo(
    () => ayahRows.filter((r) => r.status === 'memorized').length,
    [ayahRows]
  )

  const totalCount = ayahRows.length
  const percentage = totalCount > 0 ? Math.round((memorizedCount / totalCount) * 100) : 0

  const handleMarkAllMemorized = useCallback(() => {
    if (!surahId) return
    // Load surah to get ayah count
    quranService.getSurah(surahId).then((s) => {
      if (!s) return
      for (let i = 1; i <= s.ayahCount; i++) {
        markMemorized(surahId, i, 'hafs')
      }
      // Refresh rows
      const rows = hifzService.getAyahProgress(surahId, 'hafs')
      setAyahRows(rows)
    })
  }, [surahId, markMemorized])

  const handleStartReview = useCallback(() => {
    onClose()
    router.push('/(main)/review' as never)
  }, [onClose, router])

  const renderItem = useCallback(
    ({ item }: { item: AyahProgressRowData }) => (
      <AyahProgressRow
        ayahNumber={item.ayahNumber}
        strengthScore={item.strengthScore}
        lastReviewed={item.updatedAt}
        nextDue={item.dueDate}
        mistakeCount={item.mistakeCount}
        isDark={isDark}
      />
    ),
    [isDark]
  )

  const keyExtractor = useCallback(
    (item: AyahProgressRowData) => `${item.surahId}-${item.ayahNumber}`,
    []
  )

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.backdrop }]} onPress={onClose}>
        <View />
      </Pressable>

      <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerText}>
            <Text style={[styles.surahArabic, { color: colors.text }]}>{surahName.arabic}</Text>
            <Text style={[styles.surahTranslit, { color: colors.muted }]}>
              {surahName.transliteration}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.percentage, { color: colors.accent }]}>{percentage}%</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close-circle" size={28} color={colors.muted} />
            </Pressable>
          </View>
        </View>

        {/* Ayah list */}
        {ayahRows.length > 0 ? (
          <FlatList
            data={ayahRows}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No tracking data yet for this surah
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.accentBlue },
              pressed && styles.pressed,
            ]}
            onPress={handleStartReview}
          >
            <Text style={styles.actionBtnText}>Start Review</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.accent },
              pressed && styles.pressed,
            ]}
            onPress={handleMarkAllMemorized}
          >
            <Text style={styles.actionBtnText}>Mark All Memorized</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: {
    flex: 1,
  },
  surahArabic: {
    fontSize: 22,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  surahTranslit: {
    fontSize: 14,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  percentage: {
    fontSize: 20,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
})

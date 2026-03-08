/**
 * SurahGrid - 5-column FlatList grid of 114 surah cards.
 *
 * Each card is color-coded by hifz status. Tapping a card opens
 * the SurahDetailSheet for per-ayah drill-down.
 */

import React, { useEffect, useState, useCallback } from 'react'
import { View, FlatList, StyleSheet } from 'react-native'
import { useHifzStore } from '@/stores/hifzStore'
import { quranService } from '@/services/quranService'
import { SurahCard, CARD_SIZE, GRID_GAP } from './SurahCard'
import { SurahDetailSheet } from './SurahDetailSheet'
import type { HifzStatus, SurahStatus } from '@/lib/sr/types'

const GRID_COLUMNS = 5

interface SurahItem {
  id: number
  ayahCount: number
}

function deriveStatus(surahId: number, statuses: SurahStatus[]): HifzStatus {
  const entry = statuses.find((s) => s.surahId === surahId)
  if (!entry) return 'not_started'
  if (entry.needsReview > 0) return 'needs_review'
  if (entry.memorized === entry.totalAyahs) return 'memorized'
  if (entry.memorized > 0 || entry.inProgress > 0) return 'in_progress'
  return 'not_started'
}

interface SurahGridProps {
  isDark: boolean
}

export function SurahGrid({ isDark }: SurahGridProps) {
  const surahStatuses = useHifzStore((s) => s.surahStatuses)
  const loaded = useHifzStore((s) => s.loaded)
  const loadProgress = useHifzStore((s) => s.loadProgress)

  const [surahs, setSurahs] = useState<SurahItem[]>([])
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null)
  const [sheetVisible, setSheetVisible] = useState(false)

  useEffect(() => {
    if (!loaded) loadProgress('hafs')
  }, [loaded, loadProgress])

  useEffect(() => {
    quranService.getAllSurahs().then((all) => {
      setSurahs(all.map((s) => ({ id: s.id, ayahCount: s.ayahCount })))
    })
  }, [])

  const handlePress = useCallback((surahId: number) => {
    setSelectedSurah(surahId)
    setSheetVisible(true)
  }, [])

  const handleCloseSheet = useCallback(() => {
    setSheetVisible(false)
    setSelectedSurah(null)
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: SurahItem }) => {
      const status = deriveStatus(item.id, surahStatuses)
      return (
        <View style={styles.cardWrapper}>
          <SurahCard
            surahNumber={item.id}
            status={status}
            onPress={() => handlePress(item.id)}
            isDark={isDark}
          />
        </View>
      )
    },
    [surahStatuses, isDark, handlePress]
  )

  const keyExtractor = useCallback((item: SurahItem) => String(item.id), [])

  return (
    <>
      <FlatList
        data={surahs}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={GRID_COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
      <SurahDetailSheet
        visible={sheetVisible}
        surahId={selectedSurah}
        onClose={handleCloseSheet}
        isDark={isDark}
      />
    </>
  )
}

const styles = StyleSheet.create({
  grid: {
    paddingBottom: 16,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  cardWrapper: {
    // Each card has fixed size via SurahCard component
  },
})

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
  ViewToken,
} from 'react-native'
import { chapters } from '@/lib/data/mushafData'
import { quranService } from '@/services/quranService'
import { loadTranslations, getTranslationText } from '@/lib/data/translationData'
import { useSettingsStore } from '@/stores/settingsStore'
import { AyahCard } from './AyahCard'

interface CardViewProps {
  mode: 'arabic-cards' | 'translation-cards'
  initialPage: number
}

interface AyahItem {
  surahId: number
  ayahNumber: number
  arabicText: string
  surahName: string
  translationText: string
  key: string
  isSurahHeader?: boolean
}

// Static surah start pages (1-indexed by surah number)
const SURAH_START_PAGES: number[] = [
  /* placeholder index 0 */ 0,
  1, 2, 50, 77, 106, 128, 151, 177, 187, 208,
  221, 235, 249, 255, 262, 267, 282, 293, 305, 312,
  322, 332, 342, 350, 359, 367, 377, 385, 396, 404,
  411, 415, 418, 428, 434, 440, 446, 453, 458, 467,
  477, 483, 489, 496, 499, 502, 507, 511, 515, 518,
  520, 523, 526, 528, 531, 534, 537, 542, 545, 549,
  551, 553, 554, 556, 558, 560, 562, 564, 566, 568,
  570, 572, 574, 575, 577, 578, 580, 582, 583, 585,
  586, 587, 587, 589, 590, 591, 591, 592, 593, 594,
  595, 595, 596, 596, 597, 597, 598, 598, 599, 599,
  600, 600, 601, 601, 601, 602, 602, 602, 603, 603,
  603, 604, 604, 604,
]

/**
 * Find the primary surah for a given page.
 */
function getSurahForPage(page: number): number {
  for (let id = 114; id >= 1; id--) {
    if (SURAH_START_PAGES[id] <= page) return id
  }
  return 1
}

/** Initial number of surahs to load around the starting surah */
const INITIAL_SURAHS = 3
/** Surahs to load when user reaches end */
const LOAD_MORE_SURAHS = 3

const CardViewInner = function CardViewInner({ mode, initialPage }: CardViewProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const setLastReadPage = useSettingsStore((s) => s.setLastReadPage)

  const [ayahItems, setAyahItems] = useState<AyahItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const flatListRef = useRef<FlatList>(null)
  const lastLoadedSurahRef = useRef(0)
  const showTranslation = mode === 'translation-cards'

  /**
   * Load ayahs for a range of surahs [fromSurah, toSurah] inclusive.
   * Returns AyahItem[] including surah headers.
   */
  const loadSurahRange = useCallback(
    async (fromSurah: number, toSurah: number): Promise<AyahItem[]> => {
      const items: AyahItem[] = []
      const clampedTo = Math.min(toSurah, 114)

      for (let sid = fromSurah; sid <= clampedTo; sid++) {
        const ch = chapters[sid]
        if (!ch) continue

        // Surah header
        items.push({
          surahId: sid,
          ayahNumber: 0,
          arabicText: '',
          surahName: ch.nameSimple,
          translationText: '',
          key: `header-${sid}`,
          isSurahHeader: true,
        })

        // Load ayahs for this surah in batch
        const dbAyahs = await quranService.getAyahsBySurah(sid)

        for (const ayah of dbAyahs) {
          const translationText = showTranslation
            ? getTranslationText(sid, ayah.ayahNumber)
            : ''

          items.push({
            surahId: sid,
            ayahNumber: ayah.ayahNumber,
            arabicText: ayah.textUthmani,
            surahName: ch.nameSimple,
            translationText,
            key: `${sid}:${ayah.ayahNumber}`,
          })
        }
      }

      return items
    },
    [showTranslation]
  )

  // Initial load
  useEffect(() => {
    let cancelled = false

    async function init() {
      if (showTranslation) {
        await loadTranslations()
      }

      const startSurah = getSurahForPage(initialPage)
      const endSurah = Math.min(startSurah + INITIAL_SURAHS - 1, 114)

      const items = await loadSurahRange(startSurah, endSurah)

      if (!cancelled) {
        lastLoadedSurahRef.current = endSurah
        setAyahItems(items)
        setLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [initialPage, showTranslation, loadSurahRange])

  const handleEndReached = useCallback(async () => {
    if (loadingMore || lastLoadedSurahRef.current >= 114) return
    setLoadingMore(true)

    const fromSurah = lastLoadedSurahRef.current + 1
    const toSurah = Math.min(fromSurah + LOAD_MORE_SURAHS - 1, 114)
    const moreItems = await loadSurahRange(fromSurah, toSurah)

    lastLoadedSurahRef.current = toSurah
    setAyahItems((prev) => [...prev, ...moreItems])
    setLoadingMore(false)
  }, [loadingMore, loadSurahRange])

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const item = viewableItems[0].item as AyahItem
        if (item && item.surahId && !item.isSurahHeader) {
          const page = SURAH_START_PAGES[item.surahId] ?? 1
          setLastReadPage(page)
        }
      }
    }
  ).current

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current

  const headerColor = isDark ? '#b0a890' : '#6b5c3e'
  const headerBorderColor = isDark ? 'rgba(200, 168, 78, 0.2)' : 'rgba(0, 0, 0, 0.1)'

  const renderItem = useCallback(
    ({ item }: { item: AyahItem }) => {
      if (item.isSurahHeader) {
        return (
          <View style={[styles.surahHeader, { borderBottomColor: headerBorderColor }]}>
            <Text style={[styles.surahHeaderText, { color: headerColor }]}>
              {item.surahName}
            </Text>
          </View>
        )
      }

      return (
        <AyahCard
          surahId={item.surahId}
          ayahNumber={item.ayahNumber}
          arabicText={item.arabicText}
          translationText={item.translationText}
          surahName={item.surahName}
          showTranslation={showTranslation}
        />
      )
    },
    [showTranslation, headerColor, headerBorderColor]
  )

  const keyExtractor = useCallback((item: AyahItem) => item.key, [])

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={isDark ? '#c8a84e' : '#6b5c3e'} />
      </View>
    )
  }, [loadingMore, isDark])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={isDark ? '#c8a84e' : '#6b5c3e'} />
      </View>
    )
  }

  return (
    <FlatList
      ref={flatListRef}
      data={ayahItems}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      windowSize={5}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
    />
  )
}

export const CardView = React.memo(CardViewInner)

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: 60,
    paddingBottom: 160,
  },
  surahHeader: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  surahHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
})

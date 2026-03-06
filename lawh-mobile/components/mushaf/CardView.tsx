import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
  ViewToken,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { chapters } from '@/lib/data/mushafData'
import { quranService } from '@/services/quranService'
import { loadTranslations, getTranslationText } from '@/lib/data/translationData'
import { loadTransliterations, getTransliterationText } from '@/lib/data/transliterationData'
import { useSettingsStore } from '@/stores/settingsStore'
import { getPageJuzHizb } from '@/lib/data/pageJuzHizb'
import { AyahCard } from './AyahCard'
import { MushafSurahBanner } from './MushafSurahBanner'
import { MushafBismillah } from './MushafBismillah'
import { AyahActionSheet } from './AyahActionSheet'

interface CardViewProps {
  mode: 'arabic-cards' | 'translation-cards'
  initialPage: number
  onPress?: () => void
}

interface AyahItem {
  type: 'ayah'
  surahId: number
  ayahNumber: number
  surahName: string
  translationText: string
  transliterationText: string
  key: string
  page: number
}

interface PageBreakItem {
  type: 'page-break'
  page: number
  key: string
}

interface SurahHeaderItem {
  type: 'surah-header'
  surahId: number
  key: string
}

type ListItem = AyahItem | PageBreakItem | SurahHeaderItem

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

function getSurahForPage(page: number): number {
  for (let id = 114; id >= 1; id--) {
    if (SURAH_START_PAGES[id] <= page) return id
  }
  return 1
}

const INITIAL_SURAHS = 3
const LOAD_MORE_SURAHS = 3

/* ---------- Memoized list item ---------- */

interface CardListItemProps {
  item: AyahItem
  onPress?: () => void
  onMenuPress?: (surahId: number, ayahNumber: number) => void
  showTranslation: boolean
  showTransliteration: boolean
  showArabicVerse: boolean
  arabicFontSize: number
  translationFontSize: number
}

const CardListItem = React.memo(function CardListItem({
  item,
  onPress,
  onMenuPress,
  showTranslation,
  showTransliteration,
  showArabicVerse,
  arabicFontSize,
  translationFontSize,
}: CardListItemProps) {
  return (
    <Pressable onPress={onPress}>
      <AyahCard
        surahId={item.surahId}
        ayahNumber={item.ayahNumber}
        translationText={item.translationText}
        transliterationText={item.transliterationText}
        showTranslation={showTranslation}
        showTransliteration={showTransliteration}
        showArabicVerse={showArabicVerse}
        arabicFontSize={arabicFontSize}
        translationFontSize={translationFontSize}
        onMenuPress={onMenuPress ? () => onMenuPress(item.surahId, item.ayahNumber) : undefined}
      />
    </Pressable>
  )
})

const CardViewInner = function CardViewInner({ mode, initialPage, onPress }: CardViewProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const insets = useSafeAreaInsets()
  const setLastReadPage = useSettingsStore((s) => s.setLastReadPage)
  const showArabicVerse = useSettingsStore((s) => s.showArabicVerse)
  const settingsShowTranslation = useSettingsStore((s) => s.showTranslation)
  const showTransliteration = useSettingsStore((s) => s.showTransliteration)
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize)
  const translationFontSize = useSettingsStore((s) => s.translationFontSize)

  const [ayahItems, setAyahItems] = useState<AyahItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentSurahName, setCurrentSurahName] = useState('')
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [actionSheetAyah, setActionSheetAyah] = useState<{ surahId: number; ayahNumber: number } | null>(null)
  const flatListRef = useRef<FlatList<ListItem>>(null)
  const lastLoadedSurahRef = useRef(0)
  const showTranslation = mode === 'translation-cards' && settingsShowTranslation
  const effectiveShowTransliteration = mode === 'translation-cards' && showTransliteration

  const handleMenuPress = useCallback((surahId: number, ayahNumber: number) => {
    setActionSheetAyah({ surahId, ayahNumber })
  }, [])

  const handleActionSheetClose = useCallback(() => {
    setActionSheetAyah(null)
  }, [])

  const loadSurahRange = useCallback(
    async (fromSurah: number, toSurah: number): Promise<AyahItem[]> => {
      const items: AyahItem[] = []
      const clampedTo = Math.min(toSurah, 114)

      for (let sid = fromSurah; sid <= clampedTo; sid++) {
        const ch = chapters[sid]
        if (!ch) continue

        const dbAyahs = await quranService.getAyahsBySurah(sid)

        for (const ayah of dbAyahs) {
          const translationText = showTranslation
            ? getTranslationText(sid, ayah.ayahNumber)
            : ''
          const transliterationText = getTransliterationText(sid, ayah.ayahNumber)

          items.push({
            type: 'ayah',
            surahId: sid,
            ayahNumber: ayah.ayahNumber,
            surahName: ch.nameSimple,
            translationText,
            transliterationText,
            key: `${sid}:${ayah.ayahNumber}`,
            page: ayah.page,
          })
        }
      }

      return items
    },
    [showTranslation]
  )

  // Build mixed list with surah headers and page breaks
  const mixedItems = useMemo<ListItem[]>(() => {
    if (ayahItems.length === 0) return []

    const result: ListItem[] = []
    let lastSurahId: number | null = null

    for (let i = 0; i < ayahItems.length; i++) {
      const item = ayahItems[i]

      // Insert surah header before first ayah of each surah
      if (item.surahId !== lastSurahId) {
        result.push({
          type: 'surah-header',
          surahId: item.surahId,
          key: `surah-header-${item.surahId}`,
        })
        lastSurahId = item.surahId
      }

      result.push(item)

      // Insert page break after this ayah if next ayah is on a different page
      const nextItem = ayahItems[i + 1]
      if (nextItem && item.page !== nextItem.page) {
        result.push({
          type: 'page-break',
          page: nextItem.page,
          key: `page-break-${item.page}-${nextItem.page}`,
        })
      }
    }

    return result
  }, [ayahItems])

  useEffect(() => {
    let cancelled = false

    async function init() {
      await loadTransliterations()
      if (showTranslation) {
        await loadTranslations()
      }

      const startSurah = getSurahForPage(initialPage)
      const endSurah = Math.min(startSurah + INITIAL_SURAHS - 1, 114)

      const ch = chapters[startSurah]
      if (ch) setCurrentSurahName(ch.nameSimple)

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
        // Find the first ayah item among viewable items
        for (const vt of viewableItems) {
          const item = vt.item as ListItem
          if (item && item.type === 'ayah') {
            const ch = chapters[item.surahId]
            if (ch) setCurrentSurahName(ch.nameSimple)
            if (item.page) setCurrentPage(item.page)
            const page = SURAH_START_PAGES[item.surahId] ?? 1
            setLastReadPage(page)
            break
          }
        }
      }
    }
  ).current

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current

  const headerTextColor = isDark ? '#8e8e93' : '#666'
  const lineColor = isDark ? '#3a3a3c' : '#d1d1d6'

  const { juz } = getPageJuzHizb(currentPage)

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'page-break') {
        return (
          <View style={styles.pageBreakContainer}>
            <View style={[styles.pageBreakLine, { backgroundColor: lineColor }]} />
            <Text style={[styles.pageBreakText, { color: isDark ? '#8e8e93' : '#999' }]}>
              {item.page}
            </Text>
            <View style={[styles.pageBreakLine, { backgroundColor: lineColor }]} />
          </View>
        )
      }

      if (item.type === 'surah-header') {
        const ch = chapters[item.surahId]
        return (
          <View style={styles.surahHeaderContainer}>
            <MushafSurahBanner
              surahName={ch?.nameArabic ?? ''}
              surahId={item.surahId}
            />
            {ch?.bismillahPre && (
              <MushafBismillah surahId={item.surahId} />
            )}
          </View>
        )
      }

      return (
        <CardListItem
          item={item}
          onPress={onPress}
          onMenuPress={handleMenuPress}
          showTranslation={showTranslation}
          showTransliteration={effectiveShowTransliteration}
          showArabicVerse={showArabicVerse}
          arabicFontSize={arabicFontSize}
          translationFontSize={translationFontSize}
        />
      )
    },
    [showTranslation, effectiveShowTransliteration, showArabicVerse, arabicFontSize, translationFontSize, onPress, isDark, lineColor, handleMenuPress]
  )

  const keyExtractor = useCallback((item: ListItem) => item.key, [])

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={isDark ? '#8e8e93' : '#999'} />
      </View>
    )
  }, [loadingMore, isDark])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={isDark ? '#8e8e93' : '#999'} />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      {/* Sticky header: surah name | page | juz */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.headerText, { color: headerTextColor }]}>
          {currentSurahName}
        </Text>
        <Text style={[styles.headerText, { color: headerTextColor }]}>
          {currentPage}
        </Text>
        <Text style={[styles.headerText, { color: headerTextColor }]}>
          Part {juz}
        </Text>
      </View>

      <FlatList<ListItem>
        ref={flatListRef}
        data={mixedItems}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        windowSize={5}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: 160 }]}
      />

      <AyahActionSheet
        visible={actionSheetAyah !== null}
        ayahInfo={actionSheetAyah}
        onClose={handleActionSheetClose}
      />
    </View>
  )
}

export const CardView = React.memo(CardViewInner)

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '400',
  },
  listContent: {
    paddingTop: 8,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  pageBreakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  pageBreakLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  pageBreakText: {
    fontSize: 12,
    marginHorizontal: 12,
  },
  surahHeaderContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
})

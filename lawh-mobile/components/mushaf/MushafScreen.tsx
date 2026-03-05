import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  ViewToken,
  useColorScheme,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useFocusEffect } from 'expo-router'
import * as Haptics from 'expo-haptics'
import PagerView from 'react-native-pager-view'
import { useSettingsStore } from '@/stores/settingsStore'
import { useChromeToggle } from '@/hooks/useChromeToggle'
import { MushafPage, getSurahForPage, getPageJuzHizb } from './MushafPage'
import { MushafFooter } from './MushafFooter'
import { ChromeOverlay } from './ChromeOverlay'
import { AyahActionSheet } from './AyahActionSheet'
import { CardView } from './CardView'
import { quranService } from '@/services/quranService'
import { preloadPageRange } from '@/lib/fonts/qpcV4FontManager'

const TOTAL_PAGES = 604
const PAGE_RANGE = 2
const { height: SCREEN_HEIGHT } = Dimensions.get('window')

interface SelectedAyah {
  surahId: number
  ayahNumber: number
  textUthmani: string
}

export function MushafScreen() {
  const navigationMode = useSettingsStore((s) => s.navigationMode)
  const lastReadPage = useSettingsStore((s) => s.lastReadPage)
  const hasHydrated = useSettingsStore((s) => s._hasHydrated)
  const setLastReadPage = useSettingsStore((s) => s.setLastReadPage)
  const readingMode = useSettingsStore((s) => s.readingMode)
  const tajweedEnabled = useSettingsStore((s) => s.tajweedEnabled)

  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [currentPage, setCurrentPage] = useState(lastReadPage)
  const [selectedAyah, setSelectedAyah] = useState<SelectedAyah | null>(null)

  const chrome = useChromeToggle(5000)
  const { visible: chromeVisible, toggle: toggleChrome } = chrome

  // Compute tajweed color override for V4 font rendering
  // COLRv1 CPAL palette selection is not natively supported in React Native,
  // so we use a color override workaround: tajweed off => uniform text color
  const tajweedColorOverride = useMemo(() => {
    if (tajweedEnabled) return undefined // let COLRv1 colors render naturally
    return isDark ? '#e8e0d0' : '#1c1812' // uniform color overrides COLRv1 layers
  }, [tajweedEnabled, isDark])

  const pagerRef = useRef<PagerView>(null)
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    preloadPageRange(currentPage, PAGE_RANGE + 1)
  }, [currentPage])

  const initialPageSet = useRef(false)
  if (hasHydrated && !initialPageSet.current) {
    initialPageSet.current = true
    if (lastReadPage !== currentPage) {
      setCurrentPage(lastReadPage)
    }
  }

  useFocusEffect(
    useCallback(() => {
      const stored = useSettingsStore.getState().lastReadPage
      if (stored !== currentPage) {
        setCurrentPage(stored)
        if (navigationMode === 'horizontal') {
          pagerRef.current?.setPage(stored - 1)
        } else {
          flatListRef.current?.scrollToIndex({ index: stored - 1, animated: false })
        }
      }
    }, [currentPage, navigationMode])
  )

  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const page = e.nativeEvent.position + 1
      setCurrentPage(page)
      setLastReadPage(page)
    },
    [setLastReadPage]
  )

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page)
      setLastReadPage(page)
      if (navigationMode === 'horizontal') {
        pagerRef.current?.setPage(page - 1)
      } else {
        flatListRef.current?.scrollToIndex({ index: page - 1, animated: false })
      }
    },
    [navigationMode, setLastReadPage]
  )

  const handlePageTap = useCallback(() => {
    toggleChrome()
  }, [toggleChrome])

  const handleAyahLongPress = useCallback(
    async (info: { surahId: number; ayahNumber: number }) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      try {
        const text = await quranService.getAyahText(info.surahId, info.ayahNumber)
        setSelectedAyah({
          surahId: info.surahId,
          ayahNumber: info.ayahNumber,
          textUthmani: text,
        })
      } catch {
        setSelectedAyah({
          surahId: info.surahId,
          ayahNumber: info.ayahNumber,
          textUthmani: '',
        })
      }
    },
    []
  )

  const handleCloseActionSheet = useCallback(() => {
    setSelectedAyah(null)
  }, [])

  // Derive surah info for current page
  const pageInfo = useMemo(() => {
    const surah = getSurahForPage(currentPage)
    const { juz, hizb } = getPageJuzHizb(currentPage)
    return { surahName: surah?.nameSimple ?? '', juz, hizb }
  }, [currentPage])

  const pageData = useMemo(
    () => Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1),
    []
  )

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: SCREEN_HEIGHT,
      offset: SCREEN_HEIGHT * index,
      index,
    }),
    []
  )

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const page = viewableItems[0].item as number
        setCurrentPage(page)
        setLastReadPage(page)
      }
    }
  ).current

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current

  if (!hasHydrated) {
    return (
      <View style={[styles.loading, { backgroundColor: '#fff' }]}>
        <ActivityIndicator size="small" color="#999" />
      </View>
    )
  }

  const handlePopoverOpen = useCallback(() => {
    chrome.pause()
  }, [chrome])

  const handlePopoverClose = useCallback(() => {
    chrome.resume()
  }, [chrome])

  const isCardMode = readingMode === 'arabic-cards' || readingMode === 'translation-cards'

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#1c1812' : '#fff' }]}>
        <StatusBar hidden={!chromeVisible} animated />

        {isCardMode ? (
          <CardView mode={readingMode as 'arabic-cards' | 'translation-cards'} initialPage={currentPage} />
        ) : navigationMode === 'horizontal' ? (
          <PagerView
            ref={pagerRef}
            style={styles.pager}
            initialPage={lastReadPage - 1}
            layoutDirection="rtl"
            offscreenPageLimit={1}
            onPageSelected={handlePageSelected}
          >
            {Array.from({ length: TOTAL_PAGES }, (_, i) => {
              const pageNum = i + 1
              const inRange =
                pageNum >= currentPage - PAGE_RANGE && pageNum <= currentPage + PAGE_RANGE
              return (
                <View key={`page-${pageNum}`} style={styles.pageWrapper}>
                  {inRange ? (
                    <MushafPage
                      pageNumber={pageNum}
                      onAyahLongPress={handleAyahLongPress}
                      onPress={handlePageTap}
                      tajweedColorOverride={tajweedColorOverride}
                    />
                  ) : (
                    <View style={styles.placeholder} />
                  )}
                </View>
              )
            })}
          </PagerView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={pageData}
            keyExtractor={(item) => String(item)}
            renderItem={({ item }) => (
              <View style={[styles.pageWrapper, { height: SCREEN_HEIGHT }]}>
                <MushafPage
                  pageNumber={item}
                  onAyahLongPress={handleAyahLongPress}
                  onPress={handlePageTap}
                  tajweedColorOverride={tajweedColorOverride}
                />
              </View>
            )}
            getItemLayout={getItemLayout}
            initialScrollIndex={lastReadPage - 1}
            windowSize={3}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            showsVerticalScrollIndicator={false}
          />
        )}

        {chromeVisible && (
          <ChromeOverlay
            surahName={pageInfo.surahName}
            pageNumber={currentPage}
            juz={pageInfo.juz}
            hizb={pageInfo.hizb}
          />
        )}

        {chromeVisible && (
          <MushafFooter
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onLayoutPress={() => {}}
            onPopoverOpen={handlePopoverOpen}
            onPopoverClose={handlePopoverClose}
          />
        )}

        <AyahActionSheet
          visible={selectedAyah !== null}
          ayahInfo={selectedAyah}
          onClose={handleCloseActionSheet}
        />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pager: {
    flex: 1,
  },
  pageWrapper: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
  },
})

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  ViewToken,
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
import { preloadPageRange } from '@/lib/fonts/qpcV4FontManager'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'

const TOTAL_PAGES = 604
const PAGE_RANGE = 2
const { height: SCREEN_HEIGHT } = Dimensions.get('window')

interface SelectedAyah {
  surahId: number
  ayahNumber: number
}

export function MushafScreen() {
  const navigationMode = useSettingsStore((s) => s.navigationMode)
  const lastReadPage = useSettingsStore((s) => s.lastReadPage)
  const hasHydrated = useSettingsStore((s) => s._hasHydrated)
  const setLastReadPage = useSettingsStore((s) => s.setLastReadPage)
  const readingMode = useSettingsStore((s) => s.readingMode)
  const tajweedEnabled = useSettingsStore((s) => s.tajweedEnabled)

  const theme = useResolvedTheme()

  const [currentPage, setCurrentPage] = useState(lastReadPage)
  const [selectedAyah, setSelectedAyah] = useState<SelectedAyah | null>(null)

  const chrome = useChromeToggle(5000)
  const { visible: chromeVisible, toggle: toggleChrome } = chrome

  const pagerRef = useRef<PagerView>(null)
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    preloadPageRange(currentPage, PAGE_RANGE + 1, tajweedEnabled)
  }, [currentPage, tajweedEnabled])

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
      setSelectedAyah({
        surahId: info.surahId,
        ayahNumber: info.ayahNumber,
      })
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
      <View style={[styles.loading, { backgroundColor: theme.backgroundColor }]}>
        <ActivityIndicator size="small" color={theme.secondaryTextColor} />
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
    <View style={[styles.root, { backgroundColor: theme.backgroundColor }]}>
        <StatusBar hidden={!chromeVisible} animated style={theme.isDark ? 'light' : 'dark'} />

        {isCardMode ? (
          <CardView mode={readingMode as 'arabic-cards' | 'translation-cards'} initialPage={currentPage} onPress={handlePageTap} />
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
                      tajweedEnabled={tajweedEnabled}
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
                  tajweedEnabled={tajweedEnabled}
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

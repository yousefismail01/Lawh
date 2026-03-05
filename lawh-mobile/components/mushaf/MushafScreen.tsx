import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  Dimensions,
  ViewToken,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import PagerView from 'react-native-pager-view'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useSettingsStore } from '@/stores/settingsStore'
import { useChromeToggle } from '@/hooks/useChromeToggle'
import { MushafPage } from './MushafPage'
import { PageNavigator } from './PageNavigator'
import { ChromeOverlay } from './ChromeOverlay'
import { AyahActionSheet } from './AyahActionSheet'
import { quranService } from '@/services/quranService'
import { preloadPageRange } from '@/lib/fonts/qpcV4FontManager'

const TOTAL_PAGES = 604
const PAGE_RANGE = 2 // Render current +/- 2 pages in PagerView
const { height: SCREEN_HEIGHT } = Dimensions.get('window')

interface SelectedAyah {
  surahId: number
  ayahNumber: number
  textUthmani: string
}

export function MushafScreen() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const navigationMode = useSettingsStore((s) => s.navigationMode)
  const lastReadPage = useSettingsStore((s) => s.lastReadPage)
  const hasHydrated = useSettingsStore((s) => s._hasHydrated)
  const setLastReadPage = useSettingsStore((s) => s.setLastReadPage)

  const [currentPage, setCurrentPage] = useState(lastReadPage)
  const [selectedAyah, setSelectedAyah] = useState<SelectedAyah | null>(null)

  const { visible: chromeVisible, toggle: toggleChrome } = useChromeToggle(5000)

  const pagerRef = useRef<PagerView>(null)
  const flatListRef = useRef<FlatList>(null)

  // Preload V4 fonts for nearby pages (one beyond render buffer)
  useEffect(() => {
    preloadPageRange(currentPage, PAGE_RANGE + 1)
  }, [currentPage])

  // Sync currentPage with lastReadPage after hydration
  const initialPageSet = useRef(false)
  if (hasHydrated && !initialPageSet.current) {
    initialPageSet.current = true
    if (lastReadPage !== currentPage) {
      setCurrentPage(lastReadPage)
    }
  }

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

  // FlatList helpers for vertical mode
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

  return (
    <View style={[styles.root, { backgroundColor: '#fff' }]}>
        <StatusBar hidden={!chromeVisible} animated />

        {navigationMode === 'horizontal' ? (
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
          <ChromeOverlay />
        )}

        {chromeVisible && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(300)}
          >
            <PageNavigator
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </Animated.View>
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

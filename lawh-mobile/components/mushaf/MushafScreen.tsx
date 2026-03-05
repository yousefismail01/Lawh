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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import PagerView from 'react-native-pager-view'
import { useSettingsStore } from '@/stores/settingsStore'
import { MushafPage } from './MushafPage'
import { PageNavigator } from './PageNavigator'
import { SurahListModal } from './SurahListModal'
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
  const insets = useSafeAreaInsets()

  const navigationMode = useSettingsStore((s) => s.navigationMode)
  const lastReadPage = useSettingsStore((s) => s.lastReadPage)
  const hasHydrated = useSettingsStore((s) => s._hasHydrated)
  const setLastReadPage = useSettingsStore((s) => s.setLastReadPage)

  const [currentPage, setCurrentPage] = useState(lastReadPage)
  const [surahListVisible, setSurahListVisible] = useState(false)
  const [selectedAyah, setSelectedAyah] = useState<SelectedAyah | null>(null)

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

  const handleCloseSurahList = useCallback(() => {
    setSurahListVisible(false)
  }, [])

  const handleSelectSurah = useCallback(
    (page: number) => {
      handlePageChange(page)
    },
    [handlePageChange]
  )

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
    <View style={[styles.root, { backgroundColor: '#fff', paddingTop: insets.top }]}>
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

        <PageNavigator
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />

        <SurahListModal
          visible={surahListVisible}
          onClose={handleCloseSurahList}
          onSelectSurah={handleSelectSurah}
        />

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
  container: {
    flex: 1,
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

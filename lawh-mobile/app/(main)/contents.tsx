import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  SectionList,
  StyleSheet,
  ViewToken,
  Modal,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSettingsStore } from '@/stores/settingsStore'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'
import {
  buildJuzSections,
  buildChapterSections,
  getSurahStartPage,
  type JuzSection,
  type SurahInfo,
  type SortOrder,
} from '@/lib/data/contentsData'
import { getPageJuzHizb } from '@/lib/data/pageJuzHizb'
import { SurahRow } from '@/components/contents/SurahRow'
import { JuzSectionHeader } from '@/components/contents/JuzSectionHeader'
import { JuzIndex } from '@/components/contents/JuzIndex'
import { ContentsTabBar, type ContentsTab } from '@/components/contents/ContentsTabBar'

type ViewTab = 'chapters' | 'parts'

const SORT_OPTIONS: { key: SortOrder; label: string }[] = [
  { key: 'ascending', label: 'Ascending' },
  { key: 'descending', label: 'Descending' },
  { key: 'revelation', label: 'Revelation Order' },
]

// Fixed heights for getItemLayout — must match actual rendered sizes
const ITEM_HEIGHT = 58
const SECTION_HEADER_HEIGHT = 31

/** Build a getItemLayout for a SectionList with fixed row/header heights */
function makeGetItemLayout(sections: JuzSection[]) {
  // Pre-compute cumulative offsets for each section
  const sectionOffsets: number[] = []
  let offset = 0
  for (const section of sections) {
    sectionOffsets.push(offset)
    offset += SECTION_HEADER_HEIGHT + section.data.length * ITEM_HEIGHT
  }

  return (_data: unknown, flatIndex: number) => {
    // SectionList flattens: [header0, item0_0, item0_1, ..., header1, item1_0, ...]
    let remaining = flatIndex
    for (let s = 0; s < sections.length; s++) {
      if (remaining === 0) {
        // This is the section header
        return { length: SECTION_HEADER_HEIGHT, offset: sectionOffsets[s], index: flatIndex }
      }
      remaining -= 1 // skip the header
      if (remaining < sections[s].data.length) {
        // This is an item within section s
        return {
          length: ITEM_HEIGHT,
          offset: sectionOffsets[s] + SECTION_HEADER_HEIGHT + remaining * ITEM_HEIGHT,
          index: flatIndex,
        }
      }
      remaining -= sections[s].data.length
    }
    // Fallback
    return { length: ITEM_HEIGHT, offset: 0, index: flatIndex }
  }
}

/** Compute the initial scroll offset so the list opens already at the right position */
function computeInitialOffset(
  sections: JuzSection[],
  targetSectionIndex: number,
  targetItemIndex: number
): number {
  let offset = 0
  for (let s = 0; s < targetSectionIndex && s < sections.length; s++) {
    offset += SECTION_HEADER_HEIGHT + sections[s].data.length * ITEM_HEIGHT
  }
  // Add the target section's header + items before target
  offset += SECTION_HEADER_HEIGHT + targetItemIndex * ITEM_HEIGHT
  return offset
}

export default function ContentsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isDark, backgroundColor, textColor, secondaryTextColor, separatorColor, cardColor, surfaceColor, borderColor, iconColor } = useResolvedTheme()

  const [viewTab, setViewTab] = useState<ViewTab>('chapters')
  const [bottomTab, setBottomTab] = useState<ContentsTab>('contents')
  const sortOrder = useSettingsStore((s) => s.contentsSortOrder)
  const setSortOrder = useSettingsStore((s) => s.setContentsSortOrder)
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)

  const chapterListRef = useRef<SectionList<SurahInfo, JuzSection>>(null)
  const partsListRef = useRef<SectionList<SurahInfo, JuzSection>>(null)

  const chapterSections = useMemo(() => buildChapterSections(sortOrder), [sortOrder])
  const partsSections = useMemo(() => buildJuzSections(), [])

  const chapterGetItemLayout = useMemo(() => makeGetItemLayout(chapterSections), [chapterSections])
  const partsGetItemLayout = useMemo(() => makeGetItemLayout(partsSections), [partsSections])

  // Determine which surah the user is currently reading
  const lastReadPage = useSettingsStore((s) => s.lastReadPage)
  const currentSurahId = useMemo(() => {
    for (let id = 114; id >= 1; id--) {
      if (getSurahStartPage(id) <= lastReadPage) return id
    }
    return 1
  }, [lastReadPage])
  const currentJuz = useMemo(() => getPageJuzHizb(lastReadPage).juz, [lastReadPage])

  // Compute initial content offsets so lists open at the right spot (no animation)
  const chapterInitialOffset = useMemo(() => {
    const sectionIndex = chapterSections.findIndex((s) => s.juz === currentJuz)
    if (sectionIndex < 0) return 0
    const itemIndex = chapterSections[sectionIndex].data.findIndex(
      (s) => s.id === currentSurahId
    )
    return computeInitialOffset(chapterSections, sectionIndex, Math.max(0, itemIndex))
  }, [chapterSections, currentJuz, currentSurahId])

  const partsInitialOffset = useMemo(() => {
    const sectionIndex = currentJuz - 1
    return computeInitialOffset(partsSections, sectionIndex, 0)
  }, [partsSections, currentJuz])

  // Scroll to current position on layout — read offset from ref to avoid stale closures
  const hasScrolledChapters = useRef(false)
  const hasScrolledParts = useRef(false)
  const chapterOffsetRef = useRef(chapterInitialOffset)
  chapterOffsetRef.current = chapterInitialOffset
  const partsOffsetRef = useRef(partsInitialOffset)
  partsOffsetRef.current = partsInitialOffset

  const scrollListTo = useCallback((listRef: React.RefObject<SectionList<any, any> | null>, y: number) => {
    const ref = listRef.current as any
    const sv = ref?.getScrollResponder?.() ?? ref?.getNativeScrollRef?.() ?? ref?._listRef?._scrollRef
    if (sv?.scrollTo) {
      sv.scrollTo({ y, animated: false })
    }
  }, [])

  const onChapterLayout = useCallback(() => {
    if (hasScrolledChapters.current) return
    hasScrolledChapters.current = true
    const offset = chapterOffsetRef.current
    if (offset > 0) scrollListTo(chapterListRef, offset)
  }, [scrollListTo])

  const onPartsLayout = useCallback(() => {
    if (hasScrolledParts.current) return
    hasScrolledParts.current = true
    const offset = partsOffsetRef.current
    if (offset > 0) scrollListTo(partsListRef, offset)
  }, [scrollListTo])

  const handleSelectSurah = useCallback(
    (pageStart: number) => {
      useSettingsStore.getState().setLastReadPage(pageStart)
      router.back()
    },
    [router]
  )

  // Juz index handlers — use raw scrollTo with pre-computed offsets for reliability
  const handleChapterJuzSelect = useCallback(
    (juz: number, animated: boolean) => {
      const sectionIndex = chapterSections.findIndex((s) => s.juz === juz)
      if (sectionIndex >= 0) {
        const offset = computeInitialOffset(chapterSections, sectionIndex, 0)
        const scrollView = (chapterListRef.current as any)?.getScrollResponder?.()
        scrollView?.scrollTo?.({ y: offset, animated })
      }
    },
    [chapterSections]
  )

  const handlePartsJuzSelect = useCallback(
    (juz: number, animated: boolean) => {
      const offset = computeInitialOffset(partsSections, juz - 1, 0)
      const scrollView = (partsListRef.current as any)?.getScrollResponder?.()
      scrollView?.scrollTo?.({ y: offset, animated })
    },
    [partsSections]
  )

  // Track visible juz for chapters tab
  const [chaptersVisibleJuz, setChaptersVisibleJuz] = useState(currentJuz)
  const chaptersViewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 0 }).current
  const onChaptersViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const juz = (viewableItems[0].section as JuzSection)?.juz
        if (juz) setChaptersVisibleJuz(juz)
      }
    }
  ).current

  // Track visible juz for parts tab
  const [partsVisibleJuz, setPartsVisibleJuz] = useState(currentJuz)
  const partsViewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 0 }).current
  const onPartsViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const juz = (viewableItems[0].section as JuzSection)?.juz
        if (juz) setPartsVisibleJuz(juz)
      }
    }
  ).current

  const handleBottomTabChange = useCallback((tab: ContentsTab) => {
    setBottomTab(tab)
  }, [])

  const handleSortSelect = useCallback(
    (order: SortOrder) => {
      setSortOrder(order)
      setSortDropdownOpen(false)
    },
    [setSortOrder]
  )

  const showComingSoon = bottomTab !== 'contents'

  // Theme color objects for sub-components
  const surahRowColors = useMemo(() => ({
    bg: backgroundColor,
    currentBg: surfaceColor,
    text: textColor,
    muted: secondaryTextColor,
    calligraphy: iconColor,
    border: borderColor,
  }), [backgroundColor, surfaceColor, textColor, secondaryTextColor, iconColor, borderColor])

  const juzHeaderColors = useMemo(() => ({
    bg: surfaceColor,
    text: secondaryTextColor,
    line: separatorColor,
  }), [surfaceColor, secondaryTextColor, separatorColor])

  const juzIndexColors = useMemo(() => ({
    bg: isDark ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.9)',
    text: textColor,
    border: separatorColor,
  }), [isDark, textColor, separatorColor])

  const tabBarColors = useMemo(() => ({
    bg: backgroundColor,
    border: separatorColor,
    text: secondaryTextColor,
    activeText: textColor,
    muted: secondaryTextColor,
  }), [backgroundColor, separatorColor, secondaryTextColor, textColor])

  // Toggle pill colors
  const pillActiveBg = isDark ? '#fff' : '#333'
  const pillActiveBorder = isDark ? '#fff' : '#333'
  const pillActiveText = isDark ? '#000' : '#fff'

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: textColor }]}>{'\u2190'}</Text>
          <Text style={[styles.backText, { color: textColor }]}>Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>Contents</Text>
        <View style={styles.backButton} />
      </View>

      {/* View tab toggle */}
      {!showComingSoon && (
        <View style={styles.toggleRow}>
          <Pressable
            style={[
              styles.togglePill,
              { borderColor: borderColor },
              viewTab === 'chapters' && { backgroundColor: pillActiveBg, borderColor: pillActiveBorder },
            ]}
            onPress={() => setViewTab('chapters')}
          >
            <Text style={[styles.toggleText, { color: textColor }, viewTab === 'chapters' && { color: pillActiveText }]}>
              Chapters
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.togglePill,
              { borderColor: borderColor },
              viewTab === 'parts' && { backgroundColor: pillActiveBg, borderColor: pillActiveBorder },
            ]}
            onPress={() => setViewTab('parts')}
          >
            <Text style={[styles.toggleText, { color: textColor }, viewTab === 'parts' && { color: pillActiveText }]}>
              Parts
            </Text>
          </Pressable>
        </View>
      )}

      {/* Sort dropdown (chapters tab only) */}
      {!showComingSoon && viewTab === 'chapters' && (
        <View style={styles.sortRow}>
          <Pressable
            style={[styles.sortButton, { backgroundColor: surfaceColor }]}
            onPress={() => setSortDropdownOpen(true)}
          >
            <Text style={[styles.sortLabel, { color: secondaryTextColor }]}>Sort by</Text>
            <Text style={[styles.sortValue, { color: textColor }]}>
              {SORT_OPTIONS.find((o) => o.key === sortOrder)!.label}
            </Text>
            <Text style={[styles.sortChevron, { color: secondaryTextColor }]}>{'\u25BE'}</Text>
          </Pressable>
        </View>
      )}

      {/* Sort dropdown modal */}
      <Modal
        visible={sortDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortDropdownOpen(false)}
      >
        <Pressable style={styles.dropdownBackdrop} onPress={() => setSortDropdownOpen(false)}>
          <View style={[styles.dropdownMenu, { marginTop: insets.top + 120, backgroundColor }]}>
            {SORT_OPTIONS.map((option) => (
              <Pressable
                key={option.key}
                style={[
                  styles.dropdownItem,
                  sortOrder === option.key && { backgroundColor: surfaceColor },
                ]}
                onPress={() => handleSortSelect(option.key)}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    { color: textColor },
                    sortOrder === option.key && styles.dropdownItemTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {sortOrder === option.key && (
                  <Text style={[styles.dropdownCheck, { color: textColor }]}>{'\u2713'}</Text>
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Content area */}
      <View style={styles.content}>
        {showComingSoon ? (
          <View style={styles.comingSoonContainer}>
            <Text style={[styles.comingSoonText, { color: textColor }]}>Coming Soon</Text>
            <Text style={[styles.comingSoonSub, { color: secondaryTextColor }]}>
              {bottomTab === 'khatmah' && 'Track your Quran completion'}
              {bottomTab === 'bookmarks' && 'Save and organize your bookmarks'}
              {bottomTab === 'highlights' && 'View your highlighted passages'}
            </Text>
          </View>
        ) : viewTab === 'chapters' ? (
          <>
            <SectionList<SurahInfo, JuzSection>
              ref={chapterListRef}
              sections={chapterSections}
              keyExtractor={(item, index) => `ch-${item.id}-${index}`}
              stickySectionHeadersEnabled={false}
              showsVerticalScrollIndicator={false}
              getItemLayout={chapterGetItemLayout}
              contentOffset={{ x: 0, y: chapterInitialOffset }}
              onLayout={onChapterLayout}
              onViewableItemsChanged={onChaptersViewableItemsChanged}
              viewabilityConfig={chaptersViewabilityConfig}
              renderSectionHeader={({ section }) => (
                <JuzSectionHeader title={section.title} colors={juzHeaderColors} />
              )}
              renderItem={({ item }) => (
                <SurahRow
                  surah={item}
                  isCurrent={item.id === currentSurahId}
                  onSelect={handleSelectSurah}
                  colors={surahRowColors}
                />
              )}
              contentContainerStyle={styles.list}
            />
            <JuzIndex onSelectJuz={handleChapterJuzSelect} visibleJuz={chaptersVisibleJuz} colors={juzIndexColors} />
          </>
        ) : (
          <>
            <SectionList<SurahInfo, JuzSection>
              ref={partsListRef}
              sections={partsSections}
              keyExtractor={(item, index) => `pt-${item.id}-${index}`}
              stickySectionHeadersEnabled={false}
              showsVerticalScrollIndicator={false}
              getItemLayout={partsGetItemLayout}
              contentOffset={{ x: 0, y: partsInitialOffset }}
              onLayout={onPartsLayout}
              onViewableItemsChanged={onPartsViewableItemsChanged}
              viewabilityConfig={partsViewabilityConfig}
              renderSectionHeader={({ section }) => (
                <JuzSectionHeader title={section.title} colors={juzHeaderColors} />
              )}
              renderItem={({ item, section }) => (
                <SurahRow
                  surah={item}
                  isCurrent={item.id === currentSurahId && section.juz === currentJuz}
                  onSelect={handleSelectSurah}
                  colors={surahRowColors}
                />
              )}
              contentContainerStyle={styles.list}
            />
            <JuzIndex onSelectJuz={handlePartsJuzSelect} visibleJuz={partsVisibleJuz} colors={juzIndexColors} />
          </>
        )}
      </View>

      {/* Bottom tab bar */}
      <ContentsTabBar activeTab={bottomTab} onTabChange={handleBottomTabChange} colors={tabBarColors} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
  },
  backArrow: {
    fontSize: 18,
    marginRight: 4,
  },
  backText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  togglePill: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sortRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  sortValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  sortChevron: {
    fontSize: 10,
    marginLeft: 2,
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  dropdownMenu: {
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    fontWeight: '700',
  },
  dropdownCheck: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  list: {
    paddingBottom: 20,
  },
  comingSoonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  comingSoonSub: {
    fontSize: 14,
  },
})

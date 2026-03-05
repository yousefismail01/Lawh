import React, { useCallback, useMemo, useRef, useState } from 'react'
import { View, Text, Pressable, SectionList, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSettingsStore } from '@/stores/settingsStore'
import { buildJuzSections, type JuzSection, type SurahInfo } from '@/lib/data/contentsData'
import { SurahRow } from '@/components/contents/SurahRow'
import { JuzSectionHeader } from '@/components/contents/JuzSectionHeader'
import { JuzIndex } from '@/components/contents/JuzIndex'
import { QuartersTab } from '@/components/contents/QuartersTab'
import { ContentsTabBar, type ContentsTab } from '@/components/contents/ContentsTabBar'

type ViewTab = 'surahs' | 'quarters'

export default function ContentsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [viewTab, setViewTab] = useState<ViewTab>('surahs')
  const [bottomTab, setBottomTab] = useState<ContentsTab>('contents')

  const sectionListRef = useRef<SectionList<SurahInfo, JuzSection>>(null)

  const sections = useMemo(() => buildJuzSections(), [])

  const handleSelectSurah = useCallback(
    (pageStart: number) => {
      useSettingsStore.getState().setLastReadPage(pageStart)
      router.back()
    },
    [router]
  )

  const handleSelectPage = useCallback(
    (page: number) => {
      useSettingsStore.getState().setLastReadPage(page)
      router.back()
    },
    [router]
  )

  const handleSelectJuz = useCallback(
    (juz: number) => {
      const sectionIndex = juz - 1
      sectionListRef.current?.scrollToLocation({
        sectionIndex,
        itemIndex: 0,
        animated: true,
      })
    },
    []
  )

  const handleBottomTabChange = useCallback((tab: ContentsTab) => {
    setBottomTab(tab)
  }, [])

  const showComingSoon = bottomTab !== 'contents'

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backArrow}>{'\u2190'}</Text>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Contents</Text>
        <View style={styles.backButton}>
          {/* Spacer for centering */}
        </View>
      </View>

      {/* View tab toggle (Surahs / Quarters) */}
      {!showComingSoon && (
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.togglePill, viewTab === 'surahs' && styles.togglePillActive]}
            onPress={() => setViewTab('surahs')}
          >
            <Text style={[styles.toggleText, viewTab === 'surahs' && styles.toggleTextActive]}>
              Surahs
            </Text>
          </Pressable>
          <Pressable
            style={[styles.togglePill, viewTab === 'quarters' && styles.togglePillActive]}
            onPress={() => setViewTab('quarters')}
          >
            <Text style={[styles.toggleText, viewTab === 'quarters' && styles.toggleTextActive]}>
              Quarters
            </Text>
          </Pressable>
        </View>
      )}

      {/* Content area */}
      <View style={styles.content}>
        {showComingSoon ? (
          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
            <Text style={styles.comingSoonSub}>
              {bottomTab === 'khatmah' && 'Track your Quran completion'}
              {bottomTab === 'bookmarks' && 'Save and organize your bookmarks'}
              {bottomTab === 'highlights' && 'View your highlighted passages'}
            </Text>
          </View>
        ) : viewTab === 'surahs' ? (
          <>
            <SectionList<JuzSection['data'][0], JuzSection>
              ref={sectionListRef}
              sections={sections}
              keyExtractor={(item) => String(item.id)}
              stickySectionHeadersEnabled={false}
              renderSectionHeader={({ section }) => (
                <JuzSectionHeader title={section.title} />
              )}
              renderItem={({ item }) => (
                <SurahRow surah={item} onSelect={handleSelectSurah} />
              )}
              contentContainerStyle={styles.list}
            />
            <JuzIndex onSelectJuz={handleSelectJuz} />
          </>
        ) : (
          <QuartersTab onSelectPage={handleSelectPage} />
        )}
      </View>

      {/* Bottom tab bar */}
      <ContentsTabBar activeTab={bottomTab} onTabChange={handleBottomTabChange} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#faf3e0',
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
    color: '#6b5c3a',
    marginRight: 4,
  },
  backText: {
    fontSize: 16,
    color: '#6b5c3a',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  togglePill: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c4b48a',
    backgroundColor: 'transparent',
  },
  togglePillActive: {
    backgroundColor: '#6b5c3a',
    borderColor: '#6b5c3a',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b5c3a',
  },
  toggleTextActive: {
    color: '#faf3e0',
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
    color: '#6b5c3a',
    marginBottom: 8,
  },
  comingSoonSub: {
    fontSize: 14,
    color: '#9a8c6e',
  },
})

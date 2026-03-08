import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'
import { SurahGrid } from '@/components/hifz/SurahGrid'
import { StatsPanel } from '@/components/hifz/StatsPanel'
import { ReviewBadge } from '@/components/hifz/ReviewBadge'
import { useHifzStore } from '@/stores/hifzStore'

type TabKey = 'dashboard' | 'goals' | 'hifz' | 'activity'

interface Tab {
  key: TabKey
  label: string
  icon: keyof typeof Ionicons.glyphMap
}

const TABS: Tab[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
  { key: 'goals', label: 'Goals', icon: 'flag-outline' },
  { key: 'hifz', label: 'Hifz', icon: 'book-outline' },
  { key: 'activity', label: 'Activity', icon: 'pulse-outline' },
]

function DashboardTab({ colors, isDark }: { colors: ReturnType<typeof buildColors>; isDark: boolean }) {
  const router = useRouter()
  return (
    <ScrollView
      contentContainerStyle={[styles.tabContent, { paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        style={({ pressed }) => [
          styles.mushafCard,
          { backgroundColor: colors.card },
          pressed && styles.pressed,
        ]}
        onPress={() => router.back()}
      >
        <Text style={styles.mushafCardTitle}>Open Mushaf</Text>
        <Text style={styles.mushafCardSub}>Continue reading where you left off</Text>
      </Pressable>
      <ReviewBadge
        onPress={() => router.push('/(main)/review' as never)}
        isDark={isDark}
      />
    </ScrollView>
  )
}

function HifzTab({ isDark }: { isDark: boolean }) {
  const loadProgress = useHifzStore((s) => s.loadProgress)
  const loaded = useHifzStore((s) => s.loaded)

  useEffect(() => {
    if (!loaded) loadProgress('hafs')
  }, [loaded, loadProgress])

  return (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
    >
      <StatsPanel isDark={isDark} />
      <SurahGrid isDark={isDark} />
    </ScrollView>
  )
}

function PlaceholderTab({
  title,
  subtitle,
  colors,
}: {
  title: string
  subtitle: string
  colors: ReturnType<typeof buildColors>
}) {
  return (
    <ScrollView
      contentContainerStyle={[styles.tabContent, styles.tabContentCenter]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.placeholderBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.placeholderTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.placeholderSubtitle, { color: colors.muted }]}>{subtitle}</Text>
        <Text style={[styles.comingSoonBadge, { color: colors.muted, borderColor: colors.border }]}>
          Coming Soon
        </Text>
      </View>
    </ScrollView>
  )
}

function buildColors(isDark: boolean) {
  return {
    bg: isDark ? '#111' : '#fff',
    surface: isDark ? '#1e1e1e' : '#f5f5f5',
    border: isDark ? '#2a2a2a' : '#e8e8e8',
    text: isDark ? '#fff' : '#1a1a1a',
    muted: isDark ? '#666' : '#999',
    card: isDark ? '#1a1a1a' : '#333',
    tabBar: isDark ? '#1a1a1a' : '#fff',
    activeTab: isDark ? '#fff' : '#1a1a1a',
  }
}

export default function HubScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isDark } = useResolvedTheme()
  const colors = buildColors(isDark)
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')

  function renderTabContent() {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab colors={colors} isDark={isDark} />
      case 'goals':
        return (
          <PlaceholderTab
            title="Goals"
            subtitle="Track your memorization targets"
            colors={colors}
          />
        )
      case 'hifz':
        return <HifzTab isDark={isDark} />
      case 'activity':
        return (
          <PlaceholderTab
            title="Activity"
            subtitle="Recent sessions and streaks"
            colors={colors}
          />
        )
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* Top bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.bg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.topBarIcon}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <Text style={[styles.topBarTitle, { color: colors.text }]}>Lawh</Text>

        <View style={styles.topBarRight}>
          <Pressable
            onPress={() => router.push('/(main)/profile')}
            hitSlop={12}
            style={styles.topBarIcon}
          >
            <Ionicons name="person-outline" size={22} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(main)/settings')}
            hitSlop={12}
            style={styles.topBarIcon}
          >
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Tab content */}
      <View style={styles.contentArea}>{renderTabContent()}</View>

      {/* Bottom tab bar */}
      <View
        style={[
          styles.tabBar,
          {
            paddingBottom: insets.bottom,
            backgroundColor: colors.tabBar,
            borderTopColor: colors.border,
          },
        ]}
      >
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab
          return (
            <Pressable
              key={tab.key}
              style={[
                styles.tabItem,
                isActive && { borderTopColor: colors.activeTab, borderTopWidth: 2 },
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={isActive ? (tab.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap) : tab.icon}
                size={20}
                color={isActive ? colors.activeTab : colors.muted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.activeTab : colors.muted },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contentArea: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  tabContentCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  mushafCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  mushafCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  mushafCardSub: {
    fontSize: 13,
    color: '#ccc',
  },
  pressed: {
    opacity: 0.8,
  },
  comingSoonBox: {
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  comingSoonText: {
    fontSize: 14,
  },
  placeholderBox: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    width: '100%',
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  comingSoonBadge: {
    fontSize: 12,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
    borderTopWidth: 2,
    borderTopColor: 'transparent',
  },
  tabIcon: {
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
})

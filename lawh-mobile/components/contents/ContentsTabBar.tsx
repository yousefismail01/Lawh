import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'

type ContentsTab = 'contents' | 'khatmah' | 'bookmarks' | 'highlights'

interface ContentsTabBarProps {
  activeTab: ContentsTab
  onTabChange: (tab: ContentsTab) => void
}

const TABS: { key: ContentsTab; label: string; enabled: boolean }[] = [
  { key: 'contents', label: 'Contents', enabled: true },
  { key: 'khatmah', label: 'Khatmah', enabled: false },
  { key: 'bookmarks', label: 'Bookmarks', enabled: false },
  { key: 'highlights', label: 'Highlights', enabled: false },
]

function ContentsTabBarInner({ activeTab, onTabChange }: ContentsTabBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab
        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onTabChange(tab.key)}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {!tab.enabled && (
              <Text style={styles.comingSoon}>Soon</Text>
            )}
          </Pressable>
        )
      })}
    </View>
  )
}

export const ContentsTabBar = React.memo(ContentsTabBarInner)
export type { ContentsTab }

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingBottom: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#333',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
  },
  tabTextActive: {
    color: '#333',
    fontWeight: '700',
  },
  comingSoon: {
    fontSize: 8,
    color: '#ccc',
    marginTop: 1,
  },
})

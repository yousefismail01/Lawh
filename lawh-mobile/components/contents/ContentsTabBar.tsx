import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'

type ContentsTab = 'contents' | 'khatmah' | 'bookmarks' | 'highlights'

interface ContentsTabBarColors {
  bg: string
  border: string
  text: string
  activeText: string
  muted: string
}

interface ContentsTabBarProps {
  activeTab: ContentsTab
  onTabChange: (tab: ContentsTab) => void
  colors?: ContentsTabBarColors
}

const TABS: { key: ContentsTab; label: string; enabled: boolean }[] = [
  { key: 'contents', label: 'Contents', enabled: true },
  { key: 'khatmah', label: 'Khatmah', enabled: false },
  { key: 'bookmarks', label: 'Bookmarks', enabled: false },
  { key: 'highlights', label: 'Highlights', enabled: false },
]

function ContentsTabBarInner({ activeTab, onTabChange, colors }: ContentsTabBarProps) {
  const bg = colors?.bg ?? '#fff'
  const border = colors?.border ?? '#e0e0e0'
  const text = colors?.text ?? '#999'
  const activeText = colors?.activeText ?? '#333'
  const muted = colors?.muted ?? '#ccc'

  return (
    <View style={[styles.container, { backgroundColor: bg, borderTopColor: border }]}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab
        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, isActive && { borderBottomColor: activeText }]}
            onPress={() => onTabChange(tab.key)}
          >
            <Text style={[styles.tabText, { color: isActive ? activeText : text }]}>
              {tab.label}
            </Text>
            {!tab.enabled && (
              <Text style={[styles.comingSoon, { color: muted }]}>Soon</Text>
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
  tabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  comingSoon: {
    fontSize: 8,
    marginTop: 1,
  },
})

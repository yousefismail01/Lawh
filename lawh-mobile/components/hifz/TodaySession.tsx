/**
 * TodaySession - Daily session overview card showing Sabaq/Sabqi/Dhor breakdown.
 *
 * Reads from madinahHifzStore to display the three-tier Madinah method session
 * with page counts, ranges, and estimated time.
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useMadinahHifzStore } from '@/stores/madinahHifzStore'
import type { DhorCycleEntry } from '@/lib/algorithm'

interface TodaySessionProps {
  isDark: boolean
}

// Time estimates per page (minutes)
const SABAQ_MIN_PER_PAGE = 5
const SABQI_MIN_PER_PAGE = 3
const DHOR_MIN_PER_PAGE = 2

function formatRange(entries: { juz: number; startPage: number; endPage: number }[]): string {
  if (entries.length === 0) return 'None'
  if (entries.length === 1) {
    const e = entries[0]
    return `Juz ${e.juz}, p.${e.startPage}-${e.endPage}`
  }
  // Multiple entries: show juz range summary
  const juzSet = new Set(entries.map((e) => e.juz))
  const juzList = Array.from(juzSet).sort((a, b) => a - b)
  if (juzList.length === 1) {
    return `Juz ${juzList[0]}, ${entries.reduce((s, e) => s + (e.endPage - e.startPage + 1), 0)} pg`
  }
  return `Juz ${juzList[0]}-${juzList[juzList.length - 1]}`
}

function pageCount(entries: { startPage: number; endPage: number }[]): number {
  return entries.reduce((s, e) => s + (e.endPage - e.startPage + 1), 0)
}

export function TodaySession({ isDark }: TodaySessionProps) {
  const todaySession = useMadinahHifzStore((s) => s.todaySession)
  const studentLevel = useMadinahHifzStore((s) => s.studentLevel)

  const c = buildColors(isDark)

  if (!todaySession) {
    return (
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.emptyText, { color: c.muted }]}>
          Generating today's session...
        </Text>
      </View>
    )
  }

  const sabaqPages = todaySession.sabaq
    ? todaySession.sabaq.endPage - todaySession.sabaq.startPage + 1
    : 0
  const sabqiPages = pageCount(todaySession.sabqi)
  const dhorPages = pageCount(todaySession.dhor)

  const totalMinutes =
    sabaqPages * SABAQ_MIN_PER_PAGE +
    sabqiPages * SABQI_MIN_PER_PAGE +
    dhorPages * DHOR_MIN_PER_PAGE

  const hasOverdue = todaySession.dhor.some(
    (e: DhorCycleEntry) => e.priority === 'high',
  )

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: c.text }]}>
          Today's Session
        </Text>
        <View style={styles.headerRight}>
          {studentLevel !== null && (
            <View style={[styles.levelBadge, { backgroundColor: c.accent + '22' }]}>
              <Text style={[styles.levelBadgeText, { color: c.accent }]}>
                L{studentLevel}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Sabaq row */}
      <View style={styles.tierRow}>
        <View style={[styles.tierIconBox, { backgroundColor: c.sabaqBg }]}>
          <Ionicons name="book-outline" size={16} color={c.sabaq} />
        </View>
        <View style={styles.tierContent}>
          <Text style={[styles.tierLabel, { color: c.text }]}>Sabaq</Text>
          <Text style={[styles.tierDetail, { color: c.muted }]}>
            {todaySession.sabaq
              ? `Juz ${todaySession.sabaq.juz}, p.${todaySession.sabaq.startPage}-${todaySession.sabaq.endPage}`
              : 'Paused'}
          </Text>
        </View>
        {sabaqPages > 0 ? (
          <View style={[styles.pagePill, { backgroundColor: c.sabaqBg }]}>
            <Text style={[styles.pagePillText, { color: c.sabaq }]}>
              {sabaqPages} pg
            </Text>
          </View>
        ) : (
          <Text style={[styles.tierMuted, { color: c.muted }]}>--</Text>
        )}
      </View>

      {/* Sabqi row */}
      <View style={styles.tierRow}>
        <View style={[styles.tierIconBox, { backgroundColor: c.sabqiBg }]}>
          <Ionicons name="reload-outline" size={16} color={c.sabqi} />
        </View>
        <View style={styles.tierContent}>
          <Text style={[styles.tierLabel, { color: c.text }]}>Sabqi</Text>
          <Text style={[styles.tierDetail, { color: c.muted }]}>
            {todaySession.sabqi.length > 0
              ? formatRange(todaySession.sabqi)
              : 'Rest day'}
          </Text>
        </View>
        {sabqiPages > 0 ? (
          <View style={[styles.pagePill, { backgroundColor: c.sabqiBg }]}>
            <Text style={[styles.pagePillText, { color: c.sabqi }]}>
              {sabqiPages} pg
            </Text>
          </View>
        ) : (
          <Text style={[styles.tierMuted, { color: c.muted }]}>--</Text>
        )}
      </View>

      {/* Dhor row */}
      <View style={styles.tierRow}>
        <View style={[styles.tierIconBox, { backgroundColor: c.dhorBg }]}>
          <Ionicons name="library-outline" size={16} color={c.dhor} />
        </View>
        <View style={styles.tierContent}>
          <Text style={[styles.tierLabel, { color: c.text }]}>Dhor</Text>
          <Text style={[styles.tierDetail, { color: c.muted }]}>
            {todaySession.dhor.length > 0
              ? formatRange(todaySession.dhor)
              : 'None scheduled'}
          </Text>
          {hasOverdue && (
            <Text style={[styles.overdueTag, { color: c.dhor }]}>
              Overdue items
            </Text>
          )}
        </View>
        {dhorPages > 0 ? (
          <View style={[styles.pagePill, { backgroundColor: c.dhorBg }]}>
            <Text style={[styles.pagePillText, { color: c.dhor }]}>
              {dhorPages} pg
            </Text>
          </View>
        ) : (
          <Text style={[styles.tierMuted, { color: c.muted }]}>--</Text>
        )}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: c.border }]}>
        <Text style={[styles.footerText, { color: c.muted }]}>
          {todaySession.totalPages} pages total
        </Text>
        <Text style={[styles.footerText, { color: c.muted }]}>
          ~{totalMinutes} min
        </Text>
      </View>
    </View>
  )
}

function buildColors(isDark: boolean) {
  return {
    card: isDark ? '#1a1a1a' : '#fff',
    border: isDark ? '#2a2a2a' : '#e8e8e8',
    text: isDark ? '#fff' : '#1a1a1a',
    muted: isDark ? '#888' : '#777',
    accent: isDark ? '#4ade80' : '#16a34a',
    // Tier colors
    sabaq: isDark ? '#4ade80' : '#16a34a',
    sabaqBg: isDark ? 'rgba(74,222,128,0.12)' : 'rgba(22,163,74,0.08)',
    sabqi: isDark ? '#60a5fa' : '#2563eb',
    sabqiBg: isDark ? 'rgba(96,165,250,0.12)' : 'rgba(37,99,235,0.08)',
    dhor: isDark ? '#fbbf24' : '#d97706',
    dhorBg: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(217,119,6,0.08)',
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tierContent: {
    flex: 1,
  },
  tierLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  tierDetail: {
    fontSize: 13,
    marginTop: 1,
  },
  tierMuted: {
    fontSize: 13,
  },
  overdueTag: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  pagePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pagePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 4,
  },
  footerText: {
    fontSize: 13,
  },
})

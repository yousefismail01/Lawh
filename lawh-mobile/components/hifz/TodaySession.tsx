/**
 * TodaySession - Daily session overview card showing Sabaq/Sabqi/Dhor breakdown.
 *
 * Reads from madinahHifzStore to display the three-tier Madinah method session
 * with page counts, ranges, estimated time, Start Session button, and
 * level-adaptive visual weighting.
 */

import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useMadinahHifzStore } from '@/stores/madinahHifzStore'
import { getLevelConfig } from '@/lib/algorithm'
import type { DhorCycleEntry, StudentLevel } from '@/lib/algorithm'
import { JUZ_START_PAGES } from '@/lib/data/pageJuzHizb'
import { getSurahForPage } from '@/lib/data/contentsData'

interface TodaySessionProps {
  isDark: boolean
}

// Time estimates per page (minutes)
const SABAQ_MIN_PER_PAGE = 5
const SABQI_MIN_PER_PAGE = 3
const DHOR_MIN_PER_PAGE = 2

/** Convert juz-relative page to actual mushaf page number */
function toMushafPage(juz: number, relativePage: number): number {
  return JUZ_START_PAGES[juz - 1] + relativePage - 1
}

function formatRange(entries: { juz: number; startPage: number; endPage: number }[]): string {
  if (entries.length === 0) return 'None'
  if (entries.length === 1) {
    const e = entries[0]
    const start = toMushafPage(e.juz, e.startPage)
    const end = toMushafPage(e.juz, e.endPage)
    const surah = getSurahForPage(start)
    const pageStr = start === end ? `p.${start}` : `p.${start}-${end}`
    return `${surah.nameSimple} · ${pageStr}`
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

/** Get proportional flex weights from sessionSplit percentages */
function getFlexWeights(sessionSplit: [number, number, number]): [number, number, number] {
  const [sabaq, sabqi, dhor] = sessionSplit
  // Normalize: find the smallest non-zero value
  const nonZero = [sabaq, sabqi, dhor].filter((v) => v > 0)
  if (nonZero.length === 0) return [1, 1, 1]
  const min = Math.min(...nonZero)
  return [
    sabaq > 0 ? Math.round(sabaq / min) : 0,
    sabqi > 0 ? Math.round(sabqi / min) : 0,
    dhor > 0 ? Math.round(dhor / min) : 0,
  ]
}

export function TodaySession({ isDark }: TodaySessionProps) {
  const router = useRouter()
  const todaySession = useMadinahHifzStore((s) => s.todaySession)
  const studentLevel = useMadinahHifzStore((s) => s.studentLevel)
  const getMissedDays = useMadinahHifzStore((s) => s.getMissedDays)

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

  // Level-adaptive flex weights
  const levelConfig = studentLevel !== null ? getLevelConfig(studentLevel) : null
  const sessionSplit = levelConfig?.sessionSplit ?? [33, 33, 34] as [number, number, number]
  const [sabaqFlex, sabqiFlex, dhorFlex] = getFlexWeights(sessionSplit)

  // Determine dominant tier for border emphasis
  const maxPct = Math.max(...sessionSplit)
  const dominantTier = sessionSplit[0] === maxPct ? 'sabaq' : sessionSplit[1] === maxPct ? 'sabqi' : 'dhor'
  const dominantBorderColor =
    dominantTier === 'sabaq' ? c.sabaq : dominantTier === 'sabqi' ? c.sabqi : c.dhor

  // Missed days
  const missedDays = getMissedDays()

  const hideSabaq = sabaqFlex === 0

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      {/* Missed day banner */}
      {missedDays > 0 && (
        <View
          style={[
            styles.missedBanner,
            {
              backgroundColor: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(245,158,11,0.08)',
              borderColor: isDark ? 'rgba(251,191,36,0.25)' : 'rgba(245,158,11,0.2)',
            },
          ]}
        >
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color={isDark ? '#fbbf24' : '#d97706'}
          />
          <Text
            style={[
              styles.missedBannerText,
              { color: isDark ? '#fbbf24' : '#92400e' },
            ]}
          >
            Welcome back! You missed {missedDays} day{missedDays !== 1 ? 's' : ''}. Your schedule has been adjusted.
          </Text>
        </View>
      )}

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
      {!hideSabaq && (
        <View
          style={[
            styles.tierRow,
            studentLevel !== null && {
              flex: sabaqFlex,
              borderLeftWidth: dominantTier === 'sabaq' ? 3 : 0,
              borderLeftColor: dominantBorderColor,
              paddingLeft: dominantTier === 'sabaq' ? 8 : 0,
            },
          ]}
        >
          <View style={[styles.tierIconBox, { backgroundColor: c.sabaqBg }]}>
            <Ionicons name="book-outline" size={16} color={c.sabaq} />
          </View>
          <View style={styles.tierContent}>
            <Text style={[styles.tierLabel, { color: c.text }]}>New</Text>
            <Text style={[styles.tierDetail, { color: c.muted }]}>
              {todaySession.sabaq
                ? (() => {
                    const s = toMushafPage(todaySession.sabaq.juz, todaySession.sabaq.startPage)
                    const e = toMushafPage(todaySession.sabaq.juz, todaySession.sabaq.endPage)
                    const surah = getSurahForPage(s)
                    const pageStr = s === e ? `p.${s}` : `p.${s}-${e}`
                    return `${surah.nameSimple} · ${pageStr}`
                  })()
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
      )}

      {/* Sabqi row */}
      <View
        style={[
          styles.tierRow,
          studentLevel !== null && {
            flex: sabqiFlex,
            borderLeftWidth: dominantTier === 'sabqi' ? 3 : 0,
            borderLeftColor: dominantBorderColor,
            paddingLeft: dominantTier === 'sabqi' ? 8 : 0,
          },
        ]}
      >
        <View style={[styles.tierIconBox, { backgroundColor: c.sabqiBg }]}>
          <Ionicons name="reload-outline" size={16} color={c.sabqi} />
        </View>
        <View style={styles.tierContent}>
          <Text style={[styles.tierLabel, { color: c.text }]}>Review</Text>
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
      <View
        style={[
          styles.tierRow,
          studentLevel !== null && {
            flex: dhorFlex,
            borderLeftWidth: dominantTier === 'dhor' ? 3 : 0,
            borderLeftColor: dominantBorderColor,
            paddingLeft: dominantTier === 'dhor' ? 8 : 0,
          },
        ]}
      >
        <View style={[styles.tierIconBox, { backgroundColor: c.dhorBg }]}>
          <Ionicons name="library-outline" size={16} color={c.dhor} />
        </View>
        <View style={styles.tierContent}>
          <Text style={[styles.tierLabel, { color: c.text }]}>Revision</Text>
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

      {/* Start Session button */}
      <Pressable
        style={({ pressed }) => [
          styles.startButton,
          {
            backgroundColor: c.accent,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={() => router.push('/(main)/session')}
      >
        <Ionicons name="play-circle-outline" size={20} color="#fff" />
        <Text style={styles.startButtonText}>Start Session</Text>
      </Pressable>
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
  missedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  missedBannerText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    lineHeight: 17,
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
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
})

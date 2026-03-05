import React, { useMemo } from 'react'
import { View, Text, SectionList, Pressable, StyleSheet } from 'react-native'
import { buildQuarterSections, type JuzQuarterSection } from '@/lib/data/contentsData'

interface QuartersTabProps {
  onSelectPage: (page: number) => void
}

interface QuarterSectionData {
  title: string
  juz: number
  data: { hizbNumber: number; quarterIndex: number; startPage: number }[]
}

function QuartersTabInner({ onSelectPage }: QuartersTabProps) {
  const sections = useMemo(() => {
    const raw = buildQuarterSections()
    return raw.map((juzSection: JuzQuarterSection): QuarterSectionData => ({
      title: `PART ${juzSection.juz}`,
      juz: juzSection.juz,
      data: juzSection.hizbs.flatMap((hizb) =>
        hizb.quarters.map((q) => ({
          hizbNumber: hizb.hizbNumber,
          quarterIndex: q.quarterIndex,
          startPage: q.startPage,
        }))
      ),
    }))
  }, [])

  const quarterLabels = ['\u00BC', '\u00BD', '\u00BE', 'Full']

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item, index) => `${item.hizbNumber}-${item.quarterIndex}-${index}`}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <View style={styles.line} />
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.line} />
        </View>
      )}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => onSelectPage(item.startPage)}
        >
          <View style={styles.hizbBadge}>
            <Text style={styles.hizbText}>{item.hizbNumber}</Text>
          </View>
          <View style={styles.quarterInfo}>
            <Text style={styles.quarterLabel}>
              Hizb {item.hizbNumber} - {item.quarterIndex === 0 ? 'Start' : quarterLabels[item.quarterIndex - 1]}
            </Text>
            <Text style={styles.quarterPage}>Page {item.startPage}</Text>
          </View>
          <Text style={styles.pageNum}>p. {item.startPage}</Text>
        </Pressable>
      )}
      contentContainerStyle={styles.list}
    />
  )
}

export const QuartersTab = React.memo(QuartersTabInner)

const styles = StyleSheet.create({
  list: {
    paddingBottom: 80,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f5edd5',
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c4b48a',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#6b5c3a',
    marginHorizontal: 12,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#faf3e0',
  },
  rowPressed: {
    backgroundColor: '#f0e8d0',
  },
  hizbBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#c4b48a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hizbText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b5c3a',
  },
  quarterInfo: {
    flex: 1,
  },
  quarterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  quarterPage: {
    fontSize: 12,
    color: '#6b5c3a',
  },
  pageNum: {
    fontSize: 12,
    color: '#6b5c3a',
    marginLeft: 8,
  },
})

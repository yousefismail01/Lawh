import { useState, useMemo } from 'react'
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useAllSurahs } from '@/hooks/useQuranData'
import type { Surah } from '@/types/quran'

export default function HomeTab() {
  const { surahs, loading } = useAllSurahs()
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return surahs
    const q = searchQuery.toLowerCase().trim()
    return surahs.filter((s) =>
      s.nameArabic.includes(q) ||
      s.nameTransliteration.toLowerCase().includes(q) ||
      s.nameEnglish.toLowerCase().includes(q) ||
      String(s.id).includes(q)
    )
  }, [surahs, searchQuery])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search by name or number..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        clearButtonMode="while-editing"
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <SurahListItem surah={item} onPress={() => router.push(`/surah/${item.id}`)} />}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
      />
    </View>
  )
}

function SurahListItem({ surah, onPress }: { surah: Surah; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.itemNumber}>
        <Text style={styles.number}>{surah.id}</Text>
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.transliteration}>{surah.nameTransliteration}</Text>
        <Text style={styles.meta}>{surah.nameEnglish} {'\u2022'} {surah.ayahCount} ayahs</Text>
      </View>
      <Text style={styles.arabicName}>{surah.nameArabic}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  search: { margin: 12, padding: 10, backgroundColor: '#f5f5f5', borderRadius: 10, fontSize: 15 },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemNumber: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2d6a4f20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  number: { color: '#2d6a4f', fontWeight: '700', fontSize: 13 },
  itemContent: { flex: 1 },
  transliteration: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 12, color: '#888', marginTop: 1 },
  arabicName: { fontFamily: 'KFGQPCHafs', fontSize: 20, writingDirection: 'rtl', textAlign: 'right', color: '#2d6a4f', lineHeight: 40 },
})

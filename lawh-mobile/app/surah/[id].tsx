import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useSurahAyahs, useAllSurahs } from '@/hooks/useQuranData'
import { useSettingsStore } from '@/stores/settingsStore'
import { SurahHeader } from '@/components/quran/SurahHeader'
import { AyahCard } from '@/components/quran/AyahCard'
import type { Ayah } from '@/types/quran'

export default function SurahScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const surahId = parseInt(id, 10)
  const { riwayah } = useSettingsStore()
  const { surahs } = useAllSurahs()
  const { ayahs, loading } = useSurahAyahs(surahId, riwayah)

  const surah = surahs.find((s) => s.id === surahId)

  if (loading || !surah) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </View>
    )
  }

  return (
    <FlatList
      data={ayahs}
      keyExtractor={(item: Ayah) => `${item.surahId}-${item.ayahNumber}`}
      ListHeaderComponent={<SurahHeader surah={surah} />}
      renderItem={({ item }) => <AyahCard ayah={item} />}
      initialNumToRender={10}
      maxToRenderPerBatch={15}
      windowSize={5}
      // windowSize=5 prevents loading all 6,236 ayahs (Al-Baqarah=286) into memory
      style={styles.list}
    />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { flex: 1, backgroundColor: '#fff' },
})

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
} from 'react-native'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { quranService } from '@/services/quranService'
import type { Surah } from '@/types/quran'

interface SurahListModalProps {
  visible: boolean
  onClose: () => void
  onSelectSurah: (page: number) => void
}

export const SurahListModal = React.memo(function SurahListModal({
  visible,
  onClose,
  onSelectSurah,
}: SurahListModalProps) {
  const bottomSheetRef = useRef<BottomSheet>(null)
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [surahs, setSurahs] = useState<Surah[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const snapPoints = useMemo(() => ['60%', '90%'], [])

  useEffect(() => {
    if (visible) {
      loadSurahs()
      bottomSheetRef.current?.snapToIndex(0)
    } else {
      bottomSheetRef.current?.close()
    }
  }, [visible])

  const loadSurahs = useCallback(async () => {
    if (surahs.length > 0) return
    setLoading(true)
    try {
      const data = await quranService.getAllSurahs()
      setSurahs(data as Surah[])
    } catch {
      // Silently fail; user can close and reopen
    } finally {
      setLoading(false)
    }
  }, [surahs.length])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return surahs
    const q = searchQuery.toLowerCase().trim()
    return surahs.filter(
      (s) =>
        s.nameArabic.includes(q) ||
        s.nameTransliteration.toLowerCase().includes(q) ||
        s.nameEnglish.toLowerCase().includes(q) ||
        String(s.id).includes(q)
    )
  }, [surahs, searchQuery])

  const handleSelect = useCallback(
    async (surahId: number) => {
      const page = await quranService.getSurahStartPage(surahId)
      onSelectSurah(page)
      onClose()
    },
    [onSelectSurah, onClose]
  )

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  )

  const bgColor = isDark ? '#1c1812' : '#faf3e0'
  const textColor = isDark ? '#e8e0d0' : '#1a1a1a'
  const secondaryColor = isDark ? '#a09880' : '#6b5c3a'
  const borderColor = isDark ? '#3a3225' : '#d4c8a8'
  const inputBg = isDark ? '#2a241c' : '#f0e8d4'

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: bgColor }}
      handleIndicatorStyle={{ backgroundColor: secondaryColor }}
    >
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: inputBg, color: textColor }]}
          placeholder="Search surah..."
          placeholderTextColor={secondaryColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={secondaryColor} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.surahItem,
                { borderBottomColor: borderColor },
                pressed && { opacity: 0.6 },
              ]}
              onPress={() => handleSelect(item.id)}
            >
              <View style={styles.surahNumber}>
                <Text style={[styles.numberText, { color: secondaryColor }]}>{item.id}</Text>
              </View>
              <View style={styles.surahInfo}>
                <Text style={[styles.transliteration, { color: textColor }]}>
                  {item.nameTransliteration}
                </Text>
                <Text style={[styles.englishName, { color: secondaryColor }]}>
                  {item.nameEnglish} - {item.ayahCount} ayahs
                </Text>
              </View>
              <Text style={[styles.arabicName, { color: textColor }]}>{item.nameArabic}</Text>
            </Pressable>
          )}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={10}
          contentContainerStyle={styles.listContent}
        />
      )}
    </BottomSheet>
  )
})

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  searchInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  surahNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    fontSize: 13,
    fontWeight: '700',
  },
  surahInfo: {
    flex: 1,
  },
  transliteration: {
    fontSize: 15,
    fontWeight: '600',
  },
  englishName: {
    fontSize: 12,
    marginTop: 1,
  },
  arabicName: {
    fontFamily: 'KFGQPCHafs',
    fontSize: 20,
    writingDirection: 'rtl',
    lineHeight: 36,
  },
  listContent: {
    paddingBottom: 40,
  },
})

import { View, Text, StyleSheet } from 'react-native'
import type { Surah } from '@/types/quran'

const BISMILLAH = '\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064E\u0647\u0650 \u0671\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650'

interface SurahHeaderProps {
  surah: Surah
  showBismillah?: boolean  // Al-Fatiha and Al-Tawbah have special handling
}

export function SurahHeader({ surah, showBismillah = true }: SurahHeaderProps) {
  // Surah 1 (Al-Fatiha) bismillah is the first ayah, not a header
  // Surah 9 (Al-Tawbah) has no bismillah
  const displayBismillah = showBismillah && surah.id !== 1 && surah.id !== 9

  return (
    <View style={styles.container}>
      <Text style={styles.arabicName}>{surah.nameArabic}</Text>
      <Text style={styles.transliteration}>{surah.nameTransliteration}</Text>
      <Text style={styles.meta}>{surah.nameEnglish} {'\u2022'} {surah.ayahCount} Ayahs {'\u2022'} {surah.revelationType}</Text>
      {displayBismillah && (
        <Text style={styles.bismillah}>{BISMILLAH}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  arabicName: { fontFamily: 'KFGQPCHafs', fontSize: 32, writingDirection: 'rtl', textAlign: 'center', marginBottom: 4 },
  transliteration: { fontSize: 18, fontWeight: '600', marginBottom: 2 },
  meta: { fontSize: 13, color: '#666', marginBottom: 12 },
  bismillah: { fontFamily: 'KFGQPCHafs', fontSize: 20, writingDirection: 'rtl', textAlign: 'center', color: '#2d6a4f', lineHeight: 40 },
})

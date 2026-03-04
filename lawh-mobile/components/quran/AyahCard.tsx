import { View, Text, StyleSheet } from 'react-native'
import { AyahText } from './AyahText'
import type { Ayah } from '@/types/quran'

interface AyahCardProps {
  ayah: Ayah
}

export function AyahCard({ ayah }: AyahCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.ayahBadge}>
          <Text style={styles.ayahNumber}>{ayah.ayahNumber}</Text>
        </View>
        <Text style={styles.markers}>Juz {ayah.juz} {'\u00B7'} Hizb {ayah.hizb} {'\u00B7'} Rub {ayah.rub}</Text>
      </View>
      <AyahText text={ayah.textUthmani} fontSize={22} style={styles.ayahText} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' },
  ayahBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2d6a4f', justifyContent: 'center', alignItems: 'center' },
  ayahNumber: { color: '#fff', fontSize: 13, fontWeight: '600' },
  markers: { fontSize: 11, color: '#999' },
  ayahText: { paddingVertical: 4 },
})

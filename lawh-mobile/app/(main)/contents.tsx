import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'

export default function ContentsScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contents</Text>
      <Text style={styles.subtitle}>Surah glossary and juz navigation</Text>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Back to Mushaf</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 24 },
  backButton: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#f0f0f0', borderRadius: 8 },
  backText: { fontSize: 16, color: '#333' },
})

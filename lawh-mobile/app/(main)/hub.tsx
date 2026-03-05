import React from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface FeatureCard {
  key: string
  title: string
  subtitle: string
  symbol: string
  route: string
}

const FEATURES: FeatureCard[] = [
  { key: 'hifz', title: 'Hifz', subtitle: 'Track your memorization', symbol: 'H', route: '/(main)/hifz' },
  { key: 'recite', title: 'Recite', subtitle: 'Practice recitation', symbol: 'R', route: '/(main)/recite' },
  { key: 'review', title: 'Review', subtitle: 'Spaced repetition', symbol: 'V', route: '/(main)/review' },
  { key: 'profile', title: 'Profile', subtitle: 'Your progress', symbol: 'P', route: '/(main)/profile' },
  { key: 'settings', title: 'Settings', subtitle: 'App preferences', symbol: 'S', route: '/(main)/settings' },
]

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_GAP = 12
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - CARD_GAP) / 2

export default function HubScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backArrow}>{'\u2190'}</Text>
          <Text style={styles.backText}>Back to Mushaf</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* App title area */}
        <View style={styles.titleArea}>
          <Text style={styles.appTitle}>Lawh</Text>
          <Text style={styles.appSubtitle}>Your Quran Companion</Text>
        </View>

        {/* Mushaf card (prominent) */}
        <Pressable
          style={({ pressed }) => [styles.mushafCard, pressed && styles.cardPressed]}
          onPress={() => router.back()}
        >
          <Text style={styles.mushafCardTitle}>Open Mushaf</Text>
          <Text style={styles.mushafCardSub}>Continue reading where you left off</Text>
        </Pressable>

        {/* Feature cards grid */}
        <View style={styles.grid}>
          {FEATURES.map((feature) => (
            <Pressable
              key={feature.key}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push(feature.route as never)}
            >
              <View style={styles.symbolCircle}>
                <Text style={styles.symbolText}>{feature.symbol}</Text>
              </View>
              <Text style={styles.cardTitle}>{feature.title}</Text>
              <Text style={styles.cardSubtitle}>{feature.subtitle}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 18,
    color: '#333',
    marginRight: 4,
  },
  backText: {
    fontSize: 16,
    color: '#333',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  titleArea: {
    alignItems: 'center',
    marginVertical: 24,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  mushafCard: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  mushafCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  mushafCardSub: {
    fontSize: 13,
    color: '#ccc',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  cardPressed: {
    opacity: 0.8,
  },
  symbolCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  symbolText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#888',
  },
})

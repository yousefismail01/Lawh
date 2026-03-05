import 'react-native-url-polyfill/auto'
import { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { seedFromQul } from '@/lib/db/seed'
import { quranService } from '@/services/quranService'
import { sqlite } from '@/lib/db/client'

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient()

function AuthGate() {
  const { session, loading } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const inAuthGroup = segments[0] === 'auth'
    if (!session && !inAuthGroup) {
      router.replace('/auth/sign-in')
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/')
    }
  }, [session, loading, segments])

  return null
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'KFGQPCHafs': require('../assets/fonts/KFGQPCHafs.ttf'),
    'AmiriQuran': require('../assets/fonts/AmiriQuran.ttf'),
    'SurahNameV4': require('../assets/fonts/surah-name-v4.ttf'),
    'SurahNameV4Color': require('../assets/fonts/surah-names-v4-color.ttf'),
    'QuranCommon': require('../assets/fonts/quran-common.ttf'),
  })

  const { loading, setSession } = useAuthStore()
  const [seedComplete, setSeedComplete] = useState(false)
  const [seedProgress, setSeedProgress] = useState(0)
  const [seedStage, setSeedStage] = useState('')

  useEffect(() => {
    // Initialize auth state from persisted session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Check if local DB needs seeding
    async function runSeeding() {
      const seeded = await quranService.isSeeded()
      if (!seeded) {
        // Migration: if old data exists (no seed_metadata), drop and re-seed
        try {
          sqlite.execSync(`
            DROP TABLE IF EXISTS words;
            DROP TABLE IF EXISTS ayahs;
            DROP TABLE IF EXISTS surahs;
            DROP TABLE IF EXISTS seed_metadata;
          `)
          // Re-create tables after drop
          sqlite.execSync(`
            CREATE TABLE IF NOT EXISTS surahs (
              id INTEGER PRIMARY KEY,
              name_arabic TEXT NOT NULL,
              name_transliteration TEXT NOT NULL,
              name_english TEXT NOT NULL,
              ayah_count INTEGER NOT NULL,
              revelation_type TEXT NOT NULL,
              revelation_order INTEGER NOT NULL DEFAULT 0,
              page_start INTEGER NOT NULL DEFAULT 0,
              page_end INTEGER NOT NULL DEFAULT 0,
              bismillah_pre INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS ayahs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              surah_id INTEGER NOT NULL REFERENCES surahs(id),
              ayah_number INTEGER NOT NULL,
              riwayah TEXT NOT NULL DEFAULT 'hafs',
              text_uthmani TEXT NOT NULL,
              normalized_text TEXT NOT NULL,
              juz INTEGER NOT NULL,
              hizb INTEGER NOT NULL,
              rub INTEGER NOT NULL,
              page INTEGER NOT NULL,
              UNIQUE(surah_id, ayah_number, riwayah)
            );
            CREATE TABLE IF NOT EXISTS words (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              surah_id INTEGER NOT NULL,
              ayah_number INTEGER NOT NULL,
              riwayah TEXT NOT NULL DEFAULT 'hafs',
              position INTEGER NOT NULL,
              page_number INTEGER NOT NULL,
              line_number INTEGER NOT NULL,
              text_uthmani TEXT NOT NULL,
              code_v4 TEXT,
              char_type TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS seed_metadata (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            );
          `)
        } catch {
          // Tables may not exist yet — that's fine, client.ts already created them
        }

        setSeedStage('Downloading Quran data...')
        await seedFromQul((progress) => {
          if (progress.stage === 'verses') {
            setSeedProgress(progress.percent)
            setSeedStage(`Loading surahs... ${progress.current}/${progress.total}`)
          }
        })
      }
      setSeedComplete(true)
    }
    runSeeding().catch(console.error)

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (fontsLoaded && !loading && seedComplete) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, loading, seedComplete])

  if (!fontsLoaded || loading || !seedComplete) {
    // Show seed progress during first launch
    if (seedStage && !seedComplete) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'KFGQPCHafs', fontSize: 32, marginBottom: 16 }}>لوح</Text>
          <Text>{seedStage} {Math.round(seedProgress)}%</Text>
        </View>
      )
    }
    if (!fontsLoaded && !fontError) return null
    return null // Splash screen covers this
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthGate />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="surah/[id]" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}

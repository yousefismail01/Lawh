import 'react-native-url-polyfill/auto'
import { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { seedLocalDatabase } from '@/lib/db/seed'
import { quranService } from '@/services/quranService'

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
  })

  const { loading, setSession } = useAuthStore()
  const [seedComplete, setSeedComplete] = useState(false)
  const [seedProgress, setSeedProgress] = useState(0)

  useEffect(() => {
    // Initialize auth state from persisted session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Check if local DB needs seeding
    quranService.isSeeded().then((seeded) => {
      if (seeded) {
        setSeedComplete(true)
      } else {
        seedLocalDatabase((progress) => {
          if (progress.stage === 'ayahs') setSeedProgress(progress.percent)
        }).then(() => setSeedComplete(true)).catch(console.error)
      }
    })
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
    if (seedProgress > 0 && !seedComplete) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'KFGQPCHafs', fontSize: 32, marginBottom: 16 }}>لوح</Text>
          <Text>Preparing Quran... {Math.round(seedProgress)}%</Text>
        </View>
      )
    }
    if (!fontsLoaded && !fontError) return null
    return null // Splash screen covers this
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="surah/[id]" />
      </Stack>
    </QueryClientProvider>
  )
}

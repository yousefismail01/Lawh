import 'react-native-url-polyfill/auto'
import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

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
  // TODO: Download KFGQPCHafs.ttf and AmiriQuran.ttf to assets/fonts/
  // then uncomment font loading below:
  // const [fontsLoaded, fontError] = useFonts({
  //   'KFGQPCHafs': require('../assets/fonts/KFGQPCHafs.ttf'),
  //   'AmiriQuran': require('../assets/fonts/AmiriQuran.ttf'),
  // })
  const fontsLoaded = true
  const fontError = null

  const { loading, setSession } = useAuthStore()

  useEffect(() => {
    // Initialize auth state from persisted session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
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
    if (fontsLoaded && !loading) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, loading])

  if (!fontsLoaded && !fontError) return null

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

import { Platform } from 'react-native'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUpWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  async function signInWithApple() {
    if (Platform.OS !== 'ios') throw new Error('Apple Sign In is only available on iOS')
    const { signInAsync, AppleAuthenticationScope } = await import('expo-apple-authentication')
    const credential = await signInAsync({
      requestedScopes: [
        AppleAuthenticationScope.FULL_NAME,
        AppleAuthenticationScope.EMAIL,
      ],
    })
    const { error, data } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken!,
    })
    if (error) throw error

    // Apple only sends name/email on FIRST sign in — store immediately
    if (credential.fullName?.givenName && data.user) {
      const displayName = [credential.fullName.givenName, credential.fullName.familyName]
        .filter(Boolean).join(' ')
      await supabase.from('profiles').update({ display_name: displayName })
        .eq('user_id', data.user.id)
    }
  }

  async function signInWithGoogle() {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin')
    GoogleSignin.configure({
      // iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      // webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    })
    await GoogleSignin.hasPlayServices()
    await GoogleSignin.signIn()
    const { idToken } = await GoogleSignin.getTokens()
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return { signInWithEmail, signUpWithEmail, signInWithApple, signInWithGoogle, signOut }
}

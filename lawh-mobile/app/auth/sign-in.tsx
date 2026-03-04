import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert, ActivityIndicator } from 'react-native'
import { useAuth } from '@/hooks/useAuth'

export default function SignInScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signInWithEmail, signInWithApple, signInWithGoogle } = useAuth()
  const router = require('expo-router').useRouter()

  async function handleEmailSignIn() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password')
      return
    }
    setLoading(true)
    try {
      await signInWithEmail(email, password)
      // Auth gate in _layout.tsx handles redirect
    } catch (e: any) {
      Alert.alert('Sign In Failed', e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAppleSignIn() {
    setLoading(true)
    try {
      await signInWithApple()
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple Sign In Failed', e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (e: any) {
      Alert.alert('Google Sign In Failed', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>لوح</Text>
      <Text style={styles.subtitle}>Quran Memorization</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleEmailSignIn} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <TouchableOpacity style={[styles.button, styles.appleButton]} onPress={handleAppleSignIn} disabled={loading}>
          <Text style={styles.buttonText}> Sign in with Apple</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={handleGoogleSignIn} disabled={loading}>
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/auth/sign-up')}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 48, textAlign: 'center', fontFamily: 'KFGQPCHafs', marginBottom: 4 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#2d6a4f', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  appleButton: { backgroundColor: '#000' },
  googleButton: { backgroundColor: '#4285f4' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: '#2d6a4f', marginTop: 16 },
})

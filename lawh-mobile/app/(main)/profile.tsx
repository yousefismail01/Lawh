import React from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  useColorScheme,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

function buildColors(isDark: boolean) {
  return {
    bg: isDark ? '#111' : '#fff',
    surface: isDark ? '#1e1e1e' : '#f5f5f5',
    border: isDark ? '#2a2a2a' : '#e8e8e8',
    text: isDark ? '#fff' : '#1a1a1a',
    muted: isDark ? '#666' : '#999',
    avatarBg: isDark ? '#555' : '#333',
  }
}

export default function ProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const scheme = useColorScheme()
  const isDark = scheme === 'dark'
  const colors = buildColors(isDark)

  const session = useAuthStore((s) => s.session)
  const setSession = useAuthStore((s) => s.setSession)

  const user = session?.user ?? null
  const displayName: string = user?.user_metadata?.full_name ?? ''
  const email: string = user?.email ?? ''
  const initial: string =
    displayName ? displayName.charAt(0).toUpperCase()
    : email ? email.charAt(0).toUpperCase()
    : '?'
  const joinedDate: string = user?.created_at
    ? 'Joined ' +
      new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : ''

  async function handleLogOut() {
    try {
      await supabase.auth.signOut()
      setSession(null)
      router.replace('/auth/sign-in')
    } catch (err) {
      Alert.alert('Sign Out Failed', err instanceof Error ? err.message : 'An error occurred.')
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Contact support to delete your account.',
      [{ text: 'OK' }],
    )
  }

  function handleLinkPress(label: string) {
    Alert.alert(label, 'Coming soon.')
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Text style={[styles.backChevron, { color: colors.text }]}>{'\u2039'}</Text>
        </Pressable>
        <Text style={[styles.topBarTitle, { color: colors.text }]}>Profile</Text>
        <View style={styles.topBarSpacer} />
      </View>

      {/* Avatar section */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.avatarBg }]}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
        {user ? (
          <>
            {displayName ? (
              <Text style={[styles.displayName, { color: colors.text }]}>{displayName}</Text>
            ) : null}
            <Text style={[styles.emailText, { color: colors.muted }]}>{email || 'No email'}</Text>
            {joinedDate ? (
              <Text style={[styles.joinedText, { color: colors.muted }]}>{joinedDate}</Text>
            ) : null}
          </>
        ) : (
          <Text style={[styles.notSignedIn, { color: colors.muted }]}>Not signed in</Text>
        )}
      </View>

      {/* Log Out button */}
      <View style={styles.actionSection}>
        <Pressable
          style={({ pressed }) => [styles.logOutButton, pressed && styles.pressed]}
          onPress={handleLogOut}
        >
          <Text style={styles.logOutText}>Log Out</Text>
        </Pressable>
      </View>

      {/* Links section */}
      <View
        style={[
          styles.linksSection,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {(['About Lawh', 'Terms of Service', 'Privacy Policy'] as const).map(
          (label, index, arr) => (
            <React.Fragment key={label}>
              <Pressable
                style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
                onPress={() => handleLinkPress(label)}
              >
                <Text style={[styles.linkLabel, { color: colors.text }]}>{label}</Text>
                <Text style={[styles.linkChevron, { color: colors.muted }]}>{'\u203A'}</Text>
              </Pressable>
              {index < arr.length - 1 && (
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
              )}
            </React.Fragment>
          ),
        )}
      </View>

      {/* Delete Account */}
      <View style={styles.deleteSection}>
        <Pressable
          style={({ pressed }) => [pressed && styles.pressed]}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteText}>Delete Account</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 28,
    lineHeight: 32,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
  },
  topBarSpacer: {
    width: 36,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  displayName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    marginBottom: 4,
  },
  joinedText: {
    fontSize: 13,
  },
  notSignedIn: {
    fontSize: 15,
    marginTop: 4,
  },
  actionSection: {
    marginTop: 40,
    paddingHorizontal: 16,
  },
  logOutButton: {
    borderWidth: 1,
    borderColor: '#e53935',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logOutText: {
    color: '#e53935',
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  linksSection: {
    marginTop: 32,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  linkLabel: {
    fontSize: 15,
  },
  linkChevron: {
    fontSize: 18,
    lineHeight: 22,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  deleteSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  deleteText: {
    color: '#e53935',
    fontSize: 14,
  },
})

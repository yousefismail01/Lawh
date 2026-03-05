import { Stack } from 'expo-router'

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'default' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="hub" />
      <Stack.Screen name="contents" />
      <Stack.Screen name="hifz" />
      <Stack.Screen name="recite" />
      <Stack.Screen name="review" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
    </Stack>
  )
}

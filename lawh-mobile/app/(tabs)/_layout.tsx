import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Mushaf' }} />
      <Tabs.Screen name="hifz" options={{ title: 'Hifz' }} />
      <Tabs.Screen name="recite" options={{ title: 'Recite' }} />
      <Tabs.Screen name="review" options={{ title: 'Review' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  )
}

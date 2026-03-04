import { View, Text, StyleSheet } from 'react-native'

export default function HifzScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hifz placeholder</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 18 },
})

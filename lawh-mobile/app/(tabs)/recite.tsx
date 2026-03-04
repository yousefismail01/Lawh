import { View, Text, StyleSheet } from 'react-native'

export default function ReciteScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Recite placeholder</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 18 },
})

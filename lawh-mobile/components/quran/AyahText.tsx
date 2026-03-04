import { Text, StyleSheet } from 'react-native'
import type { TajweedRule } from '@/constants/tajweed'
import { TAJWEED_COLORS } from '@/constants/tajweed'

interface AyahTextProps {
  text: string
  fontSize?: number
  tajweedHighlight?: TajweedRule
  style?: object
}

// NEVER strip tashkeel from text prop — display always uses full tashkeel (text_uthmani)
// DO NOT use I18nManager.forceRTL — use per-component writingDirection only
export function AyahText({ text, fontSize = 24, tajweedHighlight, style }: AyahTextProps) {
  const color = tajweedHighlight ? TAJWEED_COLORS[tajweedHighlight] : undefined

  return (
    <Text
      style={[
        styles.arabic,
        { fontSize, lineHeight: fontSize * 2 },  // 2x lineHeight for tashkeel vertical space
        tajweedHighlight && { color },
        style,
      ]}
    >
      {text}
    </Text>
  )
}

const styles = StyleSheet.create({
  arabic: {
    fontFamily: 'KFGQPCHafs',
    writingDirection: 'rtl',   // Per-component RTL — not global I18nManager
    textAlign: 'right',
    color: '#1a1a1a',
  },
})

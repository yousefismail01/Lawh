import React from 'react'
import { View } from 'react-native'

interface AyahActionSheetProps {
  visible: boolean
  ayahInfo: { surahId: number; ayahNumber: number; textUthmani: string } | null
  onClose: () => void
}

// Stub: full implementation in Task 2
export const AyahActionSheet = React.memo(function AyahActionSheet({
  visible,
  ayahInfo,
  onClose,
}: AyahActionSheetProps) {
  if (!visible || !ayahInfo) return null
  return <View />
})

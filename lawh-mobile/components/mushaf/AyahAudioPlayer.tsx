import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { getAyahAudioSegment, type AyahAudioSegment } from '@/lib/data/audioData'

interface AyahAudioPlayerProps {
  surahId: number
  ayahNumber: number
}

/** Inner component — only rendered when we have a valid audio URL */
function AyahAudioPlayerActive({ segment }: { segment: AyahAudioSegment }) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [isPlaying, setIsPlaying] = useState(false)
  const hasStartedRef = useRef(false)

  const player = useAudioPlayer(segment.audioUrl)
  const status = useAudioPlayerStatus(player)

  const startSec = segment.startMs / 1000
  const endSec = segment.endMs / 1000
  const segmentDuration = endSec - startSec

  // Monitor playback position - stop at end of ayah segment
  useEffect(() => {
    if (!isPlaying) return
    if (status.currentTime >= endSec) {
      player.pause()
      setIsPlaying(false)
    }
  }, [status.currentTime, endSec, isPlaying, player])

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      player.pause()
      setIsPlaying(false)
    } else {
      const seekTarget = Math.max(0, startSec - 0.1)
      if (!hasStartedRef.current || status.currentTime < startSec || status.currentTime >= endSec) {
        await player.seekTo(seekTarget)
        hasStartedRef.current = true
      }
      player.play()
      setIsPlaying(true)
    }
  }, [isPlaying, player, startSec, endSec, status.currentTime])

  const elapsed = Math.max(0, Math.min(status.currentTime - startSec, segmentDuration))
  const progress = segmentDuration > 0 ? elapsed / segmentDuration : 0

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const textColor = isDark ? '#e8e0d0' : '#1a1a1a'
  const secondaryColor = isDark ? '#a09880' : '#6b5c3a'
  const trackBg = isDark ? '#3a3225' : '#d4c8a8'
  const fillColor = isDark ? '#c8a855' : '#8b7332'

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePlayPause} style={styles.playButton}>
        <Text style={[styles.playIcon, { color: textColor }]}>
          {isPlaying ? '\u23F8' : '\u25B6'}
        </Text>
      </Pressable>

      <View style={styles.progressContainer}>
        <View style={[styles.progressTrack, { backgroundColor: trackBg }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: fillColor, width: `${Math.min(progress * 100, 100)}%` },
            ]}
          />
        </View>
        <Text style={[styles.timeText, { color: secondaryColor }]}>
          {formatTime(elapsed)} / {formatTime(segmentDuration)}
        </Text>
      </View>
    </View>
  )
}

export const AyahAudioPlayer = React.memo(function AyahAudioPlayer({
  surahId,
  ayahNumber,
}: AyahAudioPlayerProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const secondaryColor = isDark ? '#a09880' : '#6b5c3a'

  const [segment, setSegment] = useState<AyahAudioSegment | null>(null)

  useEffect(() => {
    let cancelled = false
    getAyahAudioSegment(surahId, ayahNumber).then((seg) => {
      if (!cancelled && seg) setSegment(seg)
    })
    return () => { cancelled = true }
  }, [surahId, ayahNumber])

  if (!segment) {
    return (
      <View style={styles.container}>
        <Text style={[styles.loadingText, { color: secondaryColor }]}>Loading audio...</Text>
      </View>
    )
  }

  return <AyahAudioPlayerActive segment={segment} />
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 20,
  },
  progressContainer: {
    flex: 1,
    gap: 4,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeText: {
    fontSize: 11,
  },
  loadingText: {
    fontSize: 13,
    paddingVertical: 8,
  },
})

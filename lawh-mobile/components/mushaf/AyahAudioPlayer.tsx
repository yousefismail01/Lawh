import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native'
import { Audio } from 'expo-av'
import { getAyahAudioSegment, type AyahAudioSegment } from '@/lib/data/audioData'

interface AyahAudioPlayerProps {
  surahId: number
  ayahNumber: number
}

export const AyahAudioPlayer = React.memo(function AyahAudioPlayer({
  surahId,
  ayahNumber,
}: AyahAudioPlayerProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [segment, setSegment] = useState<AyahAudioSegment | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const soundRef = useRef<Audio.Sound | null>(null)

  // Load segment data
  useEffect(() => {
    let cancelled = false
    getAyahAudioSegment(surahId, ayahNumber).then((seg) => {
      if (!cancelled && seg) setSegment(seg)
    })
    return () => { cancelled = true }
  }, [surahId, ayahNumber])

  // Create and manage sound object
  useEffect(() => {
    if (!segment) return

    let sound: Audio.Sound | null = null
    let cancelled = false

    const load = async () => {
      const { sound: s } = await Audio.Sound.createAsync(
        { uri: segment.audioUrl },
        { shouldPlay: false },
        (status) => {
          if (!cancelled && status.isLoaded) {
            setCurrentTime(status.positionMillis / 1000)
            if (status.positionMillis / 1000 >= segment.endMs / 1000) {
              s.pauseAsync()
              setIsPlaying(false)
            }
          }
        }
      )
      if (cancelled) {
        s.unloadAsync()
        return
      }
      sound = s
      soundRef.current = s
    }

    load()

    return () => {
      cancelled = true
      if (sound) sound.unloadAsync()
      soundRef.current = null
    }
  }, [segment])

  const startSec = segment ? segment.startMs / 1000 : 0
  const endSec = segment ? segment.endMs / 1000 : 0
  const segmentDuration = endSec - startSec

  const handlePlayPause = useCallback(async () => {
    const sound = soundRef.current
    if (!sound || !segment) return

    if (isPlaying) {
      await sound.pauseAsync()
      setIsPlaying(false)
    } else {
      const seekMs = Math.max(0, segment.startMs - 100)
      if (currentTime < startSec || currentTime >= endSec) {
        await sound.setPositionAsync(seekMs)
      }
      await sound.playAsync()
      setIsPlaying(true)
    }
  }, [segment, isPlaying, currentTime, startSec, endSec])

  const elapsed = Math.max(0, Math.min(currentTime - startSec, segmentDuration))
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

  if (!segment) {
    return (
      <View style={styles.container}>
        <Text style={[styles.loadingText, { color: secondaryColor }]}>Loading audio...</Text>
      </View>
    )
  }

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

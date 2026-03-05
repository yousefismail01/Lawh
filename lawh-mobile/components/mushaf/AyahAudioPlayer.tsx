import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native'
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
  const [error, setError] = useState<string | null>(null)
  const playerRef = useRef<any>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load segment data
  useEffect(() => {
    let cancelled = false
    getAyahAudioSegment(surahId, ayahNumber).then((seg) => {
      if (!cancelled && seg) setSegment(seg)
    })
    return () => { cancelled = true }
  }, [surahId, ayahNumber])

  // Create player when segment is ready
  useEffect(() => {
    if (!segment) return

    let cancelled = false

    const init = async () => {
      try {
        const { createAudioPlayer } = await import('expo-audio')
        const player = createAudioPlayer(segment.audioUrl)
        if (cancelled) return
        playerRef.current = player
      } catch (e: any) {
        if (!cancelled) setError('Audio not available')
      }
    }

    init()

    return () => {
      cancelled = true
      if (intervalRef.current) clearInterval(intervalRef.current)
      try { playerRef.current?.remove() } catch {}
      playerRef.current = null
    }
  }, [segment])

  // Poll position while playing
  useEffect(() => {
    if (isPlaying && segment) {
      intervalRef.current = setInterval(() => {
        const player = playerRef.current
        if (player) {
          const time = player.currentTime ?? 0
          setCurrentTime(time)
          if (time >= segment.endMs / 1000) {
            player.pause()
            setIsPlaying(false)
          }
        }
      }, 200)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, segment])

  const startSec = segment ? segment.startMs / 1000 : 0
  const endSec = segment ? segment.endMs / 1000 : 0
  const segmentDuration = endSec - startSec

  const handlePlayPause = useCallback(async () => {
    const player = playerRef.current
    if (!player || !segment) return

    try {
      if (isPlaying) {
        player.pause()
        setIsPlaying(false)
      } else {
        const seekTarget = Math.max(0, startSec - 0.1)
        if (currentTime < startSec || currentTime >= endSec) {
          player.seekTo(seekTarget)
        }
        player.play()
        setIsPlaying(true)
      }
    } catch {
      setError('Playback failed')
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

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={[styles.loadingText, { color: secondaryColor }]}>{error}</Text>
      </View>
    )
  }

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

import { fetchReciters, fetchAudioSegments } from '@/lib/api/qul'
import type { Reciter, AudioSegment } from '@/types/audio'

// In-memory caches
let recitersCache: Reciter[] | null = null
const segmentsCache = new Map<string, AudioSegment[]>()

export const audioService = {
  async getReciters(): Promise<Reciter[]> {
    if (recitersCache) return recitersCache

    const raw = await fetchReciters()
    recitersCache = raw.map((r) => ({
      id: r.id,
      reciterName: r.reciter_name,
      style: r.style,
    }))
    return recitersCache
  },

  async getSegments(recitationId: number, surahId: number): Promise<AudioSegment[]> {
    const key = `${recitationId}:${surahId}`
    const cached = segmentsCache.get(key)
    if (cached) return cached

    const raw = await fetchAudioSegments(recitationId, surahId)
    const segments: AudioSegment[] = raw.map((s) => ({
      verseKey: s.verse_key,
      url: s.url,
      segments: s.segments,
    }))

    segmentsCache.set(key, segments)
    return segments
  },

  clearCache() {
    recitersCache = null
    segmentsCache.clear()
  },
}

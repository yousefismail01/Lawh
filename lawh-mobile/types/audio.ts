export interface Reciter {
  id: number
  reciterName: string
  style: string | null
}

export interface AudioSegment {
  verseKey: string
  url: string
  segments: number[][] // [start_ms, end_ms, word_position][]
}

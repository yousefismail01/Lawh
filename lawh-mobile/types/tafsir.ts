export interface TafsirResource {
  id: number
  name: string
  authorName: string
  languageName: string
}

export interface TafsirEntry {
  resourceId: number
  text: string
  verseKey: string
}

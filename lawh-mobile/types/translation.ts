export interface TranslationResource {
  id: number
  name: string
  authorName: string
  languageName: string
}

export interface TranslationEntry {
  resourceId: number
  text: string
  verseKey: string
}

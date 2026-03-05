import { File, Directory, Paths } from 'expo-file-system'
import * as Font from 'expo-font'

const CDN_BASE = 'https://static-cdn.tarteel.ai/qul/fonts/quran_fonts/v4-tajweed/ttf'
const CACHE_DIR = new Directory(Paths.document, 'qpc_v4_fonts')

type FontStatus = 'loading' | 'loaded' | 'error'
const fontStatus = new Map<number, FontStatus>()

export function getV4FontName(page: number): string {
  return `QPCV4Tajweed_p${page}`
}

export function isV4FontLoaded(page: number): boolean {
  return fontStatus.get(page) === 'loaded'
}

export async function loadV4Font(page: number): Promise<void> {
  const status = fontStatus.get(page)
  if (status === 'loaded' || status === 'loading') return

  fontStatus.set(page, 'loading')

  try {
    // Ensure cache directory exists
    if (!CACHE_DIR.exists) {
      CACHE_DIR.create({ intermediates: true })
    }

    const localFile = new File(CACHE_DIR, `p${page}.ttf`)

    if (!localFile.exists) {
      await File.downloadFileAsync(`${CDN_BASE}/p${page}.ttf`, localFile)
    }

    const fontName = getV4FontName(page)
    await Font.loadAsync({ [fontName]: localFile.uri })

    fontStatus.set(page, 'loaded')
  } catch {
    fontStatus.set(page, 'error')
  }
}

export async function preloadPageRange(center: number, radius: number): Promise<void> {
  const promises: Promise<void>[] = []
  for (let i = Math.max(1, center - radius); i <= Math.min(604, center + radius); i++) {
    promises.push(loadV4Font(i))
  }
  await Promise.allSettled(promises)
}

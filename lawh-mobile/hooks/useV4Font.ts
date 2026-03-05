import { useEffect, useState } from 'react'
import { loadV4Font, isV4FontLoaded, getV4FontName } from '@/lib/fonts/qpcV4FontManager'

const FALLBACK_FONT = 'KFGQPCHafs'

export function useV4Font(pageNumber: number): { fontName: string; isLoaded: boolean } {
  const [loaded, setLoaded] = useState(() => isV4FontLoaded(pageNumber))

  useEffect(() => {
    if (isV4FontLoaded(pageNumber)) {
      setLoaded(true)
      return
    }

    setLoaded(false)
    loadV4Font(pageNumber).then(() => {
      if (isV4FontLoaded(pageNumber)) {
        setLoaded(true)
      }
    })
  }, [pageNumber])

  return {
    fontName: loaded ? getV4FontName(pageNumber) : FALLBACK_FONT,
    isLoaded: loaded,
  }
}

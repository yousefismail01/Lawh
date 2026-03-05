import { useState, useRef, useCallback, useEffect } from 'react'
import { useFocusEffect } from 'expo-router'

const DEFAULT_AUTO_HIDE_MS = 5000

/**
 * Hook for managing chrome (overlay UI) visibility with auto-hide timer.
 * Used by MushafScreen to toggle PageNavigator + overlay icons.
 *
 * - `visible` starts as `true` (chrome shown on app launch)
 * - `toggle()` flips visibility; if turning ON, starts auto-hide timer
 * - `resetTimer()` restarts the auto-hide countdown
 * - `show()` / `hide()` for explicit control
 * - Auto-hides after `autoHideMs` (default 5000ms)
 * - Timer resets when screen regains focus
 * - Cleanup on unmount
 */
export function useChromeToggle(autoHideMs: number = DEFAULT_AUTO_HIDE_MS) {
  const [visible, setVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pausedRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    if (pausedRef.current) return
    clearTimer()
    timerRef.current = setTimeout(() => {
      setVisible(false)
    }, autoHideMs)
  }, [autoHideMs, clearTimer])

  const resetTimer = useCallback(() => {
    if (visible) {
      startTimer()
    }
  }, [visible, startTimer])

  const show = useCallback(() => {
    setVisible(true)
    startTimer()
  }, [startTimer])

  const hide = useCallback(() => {
    clearTimer()
    setVisible(false)
  }, [clearTimer])

  const toggle = useCallback(() => {
    setVisible((prev) => {
      if (!prev) {
        // Turning ON -- start auto-hide timer
        startTimer()
      } else {
        // Turning OFF -- clear timer
        clearTimer()
      }
      return !prev
    })
  }, [startTimer, clearTimer])

  // Start auto-hide timer on mount when visible
  useEffect(() => {
    if (visible) {
      startTimer()
    }
    return clearTimer
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset timer when screen regains focus (expo-router pitfall #2)
  useFocusEffect(
    useCallback(() => {
      if (visible) {
        startTimer()
      }
      return clearTimer
    }, [visible, startTimer, clearTimer])
  )

  const pause = useCallback(() => {
    pausedRef.current = true
    clearTimer()
  }, [clearTimer])

  const resume = useCallback(() => {
    pausedRef.current = false
    if (visible) {
      startTimer()
    }
  }, [visible, startTimer])

  return { visible, toggle, resetTimer, show, hide, pause, resume }
}

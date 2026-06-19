import { useEffect, useRef, useState } from 'react'

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

/** Animates numeric transitions: returns `value` immediately on first mount,
 * then tweens from the previous value to any new value over `durationMs`. */
export function useCountUp(value: number, durationMs = 600): number {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const from = prevRef.current
    const to = value
    if (from === to) return

    const start = performance.now()
    cancelAnimationFrame(frameRef.current)

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = easeOutCubic(t)
      setDisplay(from + (to - from) * eased)
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        prevRef.current = to
      }
    }
    frameRef.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frameRef.current)
  }, [value, durationMs])

  return display
}

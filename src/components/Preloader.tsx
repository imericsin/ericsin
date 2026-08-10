import { useEffect, useState } from 'react'

const SESSION_KEY = 'preloader-shown'
const DURATION_MS = 2400
const EXIT_MS = 700

// Long enough to cover every forward wrap a digit makes while counting
// 001->100 (the ones digit wraps ~10 times, tens ~1) without ever running
// out of cells to scroll into.
const CYCLES = 12
const STRIP = Array.from({ length: CYCLES * 10 }, (_, i) => i % 10)

// One rolodex digit: a repeating 0-9 strip that only ever slides one
// direction (up). `ticks` is a monotonically increasing count of how many
// times this slot has advanced — NOT the raw 0-9 value — so a wrap from
// 9 back to 0 keeps scrolling forward into the strip's next "0" cell
// instead of reversing direction to find the nearest 0 above it.
function RolodexDigit({ ticks }: { ticks: number }) {
  return (
    <span className="rolodex-digit">
      <span className="rolodex-digit__strip" style={{ transform: `translateY(-${ticks * 10}%)` }}>
        {STRIP.map((d, i) => (
          <span key={i} className="rolodex-digit__cell">{d}</span>
        ))}
      </span>
    </span>
  )
}

export default function Preloader() {
  const [shouldRender, setShouldRender] = useState(() => {
    if (typeof window === 'undefined') return false
    if (window.location.pathname !== '/') return false
    return !sessionStorage.getItem(SESSION_KEY)
  })
  const [percent, setPercent] = useState(0)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (!shouldRender) return
    sessionStorage.setItem(SESSION_KEY, '1')

    const start = performance.now()
    let raf: number

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / DURATION_MS, 1)
      setPercent(Math.round(progress * 100))
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setExiting(true)
        setTimeout(() => setShouldRender(false), EXIT_MS)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [shouldRender])

  useEffect(() => {
    if (shouldRender) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [shouldRender])

  if (!shouldRender) return null

  // Always three fixed slots (hundreds/tens/ones) so a digit's position
  // always means the same place value — a variable-length digit array
  // broke this when the digit count changed. Percent is 1-indexed (001,
  // not 000) per spec.
  const value = percent || 1

  // Cumulative tick counts per slot, not raw 0-9 digits — each slot only
  // ever counts up, so RolodexDigit can always scroll the same direction
  // (a raw digit that wraps 9->0 would otherwise have to reverse to find
  // the nearest 0 above it in the strip).
  const onesTicks = value
  const tensTicks = Math.floor(value / 10)
  const hundredsTicks = Math.floor(value / 100)

  return (
    <div className={`preloader${exiting ? ' preloader--exiting' : ''}`} aria-hidden>
      <span className="preloader__count">
        <RolodexDigit ticks={hundredsTicks} />
        <RolodexDigit ticks={tensTicks} />
        <RolodexDigit ticks={onesTicks} />
      </span>
    </div>
  )
}

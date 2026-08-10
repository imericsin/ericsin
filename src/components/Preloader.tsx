import { useEffect, useState } from 'react'

const SESSION_KEY = 'preloader-shown'
const DURATION_MS = 1600
const EXIT_MS = 700

const DIGITS = Array.from({ length: 10 }, (_, i) => i)

// One rolodex digit: a 0-9 strip that slides vertically so the active
// digit lands in view, giving the "spinning odometer" feel on change.
function RolodexDigit({ value }: { value: number }) {
  return (
    <span className="rolodex-digit">
      <span className="rolodex-digit__strip" style={{ transform: `translateY(-${value * 10}%)` }}>
        {DIGITS.map(d => (
          <span key={d} className="rolodex-digit__cell">{d}</span>
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
  // always means the same place value — keying by array index alone broke
  // this when the digit count changed (e.g. 9 -> 10 made position 0 jump
  // from "the only digit" to "the tens digit", animating 9->1 instead of
  // counting up smoothly). Percent is 1-indexed (001, not 000) per spec.
  const digits = String(percent || 1).padStart(3, '0').split('').map(Number)

  return (
    <div className={`preloader${exiting ? ' preloader--exiting' : ''}`} aria-hidden>
      <span className="preloader__count">
        {digits.map((d, i) => <RolodexDigit key={i} value={d} />)}
      </span>
    </div>
  )
}

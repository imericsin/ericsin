import { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { createPortal } from 'react-dom'
import Nav from './components/Nav'
import NavMobile from './components/NavMobile'
import Home from './pages/Home'
import About from './pages/About'
import WorksPage from './pages/WorksPage'
import WorkPage from './pages/WorkPage'
import Archives from './pages/Archives'

const LERP = 0.1

function useMouseTrail(enabled: boolean) {
  const target = useRef({ x: -200, y: -200 })
  const current = useRef({ x: -200, y: -200 })
  const raf = useRef<number | null>(null)
  const elRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onMove(e: MouseEvent) { target.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    if (!enabled) {
      if (raf.current) { cancelAnimationFrame(raf.current); raf.current = null }
      return
    }
    function loop() {
      current.current.x += (target.current.x - current.current.x) * LERP
      current.current.y += (target.current.y - current.current.y) * LERP
      if (elRef.current) elRef.current.style.transform = `translate(${current.current.x}px, ${current.current.y}px)`
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [enabled])

  return elRef
}

interface TooltipCtx { onEnter: () => void; onLeave: () => void }
export const CardTooltipContext = createContext<TooltipCtx>({ onEnter: () => {}, onLeave: () => {} })

function applyTheme(theme: Record<string, string> | null) {
  const root = document.documentElement
  const known = ['--system-background-1','--system-hero-primary','--system-hero-secondary',
    '--system-body-primary','--system-body-secondary','--component-fg-1','--component-fg-2',
    '--component-fg-3','--component-fg-4','--component-border-1','--component-border-2',
    '--component-border-3','--component-border-4']
  known.forEach(k => root.style.removeProperty(k))
  if (theme) Object.entries(theme).forEach(([k, v]) => root.style.setProperty(k, v))
}

export default function App() {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [fading, setFading] = useState(false)
  const pendingTheme = useRef<Record<string, string> | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const tooltipRef = useMouseTrail(tooltipVisible)
  const onEnter = useCallback(() => setTooltipVisible(true), [])
  const onLeave = useCallback(() => setTooltipVisible(false), [])

  useEffect(() => {
    document.body.dataset.page = location.pathname === '/about' ? 'about' : ''
    setTooltipVisible(false)
  }, [location.pathname])

  useEffect(() => {
    if (location.pathname === displayLocation.pathname) return
    if (!location.pathname.startsWith('/work/')) pendingTheme.current = null

    setFading(true)
    timer.current = setTimeout(() => {
      window.scrollTo(0, 0)
      applyTheme(pendingTheme.current)
      setDisplayLocation(location)
      setFading(false)
    }, 280)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [location])

  function handleTheme(theme: Record<string, string> | null) {
    pendingTheme.current = theme
    if (!fading) applyTheme(theme)
  }

  return (
    <CardTooltipContext.Provider value={{ onEnter, onLeave }}>
      <Nav />
      <NavMobile />
      <div className="app">
        <div
          key={displayLocation.pathname}
          style={{ width: '100%', opacity: fading ? 0 : 1, transition: 'opacity 0.28s ease' }}
        >
          <Routes location={displayLocation}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/work" element={<WorksPage />} />
            <Route path="/work/:slug" element={<WorkPage onTheme={handleTheme} />} />
            <Route path="/archives" element={<Archives />} />
          </Routes>
        </div>
      </div>
      {createPortal(
        <div
          ref={tooltipRef}
          className={`archive-tooltip${tooltipVisible ? ' archive-tooltip--visible' : ''}`}
          aria-hidden
        >
          View Details
        </div>,
        document.body
      )}
    </CardTooltipContext.Provider>
  )
}

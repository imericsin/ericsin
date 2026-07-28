import { useEffect, useRef, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Nav from './components/Nav'
import NavMobile from './components/NavMobile'
import Home from './pages/Home'
import About from './pages/About'
import WorksPage from './pages/WorksPage'
import WorkPage from './pages/WorkPage'

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

  useEffect(() => {
    document.body.dataset.page = location.pathname === '/about' ? 'about' : ''
  }, [location.pathname])

  useEffect(() => {
    if (location.pathname === displayLocation.pathname) return
    if (!location.pathname.startsWith('/work/')) pendingTheme.current = null

    setFading(true)
    timer.current = setTimeout(() => {
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
    <>
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
          </Routes>
        </div>
      </div>
    </>
  )
}

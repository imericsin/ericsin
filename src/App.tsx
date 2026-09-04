import { useEffect, useRef, useState, useCallback, useMemo, createContext, useContext } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { createPortal } from 'react-dom'
import Nav from './components/Nav'
import NavMobile from './components/NavMobile'
import Home from './pages/Home'
import About from './pages/About'
import WorkPage from './pages/WorkPage'
import Archives from './pages/Archives'
import ToastDemo from './pages/ToastDemo'
import PromptDemo from './pages/PromptDemo'
import CommandPalette from './components/CommandPalette'
import { useWorkIndex } from './hooks/useWorkIndex'
import { usePageContext } from './hooks/usePageContext'
import { PromptContext } from './lib/promptContext'

// WorksPage (the old /work index) is kept in the codebase for possible
// future reuse but is intentionally unmounted — Home is now the Work index.
// import WorksPage from './pages/WorksPage'

// Per-case-study theming (frontmatter `theme:` values applied to each
// WorkPage) is temporarily disabled while the actual color values are
// still being worked out — every case study renders with the default
// site theme instead. Flip back to true once those values are finalized;
// WorkPage/layout.md frontmatter and applyTheme() below are untouched, so
// this is the only line that needs to change.
const THEMING_ENABLED = false

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

// Relative luminance of a #rrggbb string, 0 (black) – 1 (white).
function luminance(hex: string): number | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function applyTheme(theme: Record<string, string> | null) {
  const root = document.documentElement
  const known = ['--system-background-1','--system-hero-primary','--system-hero-secondary',
    '--system-body-primary','--system-body-secondary','--component-fg-1','--component-fg-2',
    '--component-fg-3','--component-fg-4','--component-border-1','--component-border-2',
    '--component-border-3','--component-border-4']
  known.forEach(k => root.style.removeProperty(k))
  root.style.removeProperty('--prompt-fill-mix')
  root.style.removeProperty('--prompt-fill-mix-focus')
  if (theme) Object.entries(theme).forEach(([k, v]) => root.style.setProperty(k, v))

  // A light tint over a dark ground needs more weight than a dark tint over
  // white to read as the same visual step, so bump the chat input's fill mix
  // on dark case-study themes.
  const bg = theme?.['--system-background-1']
  const lum = bg ? luminance(bg) : null
  if (lum !== null && lum < 0.4) {
    root.style.setProperty('--prompt-fill-mix', '12%')
    root.style.setProperty('--prompt-fill-mix-focus', '18%')
  }
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

  // v6.5's case-study nav shows "Work / {title}" instead of the site
  // identity — WorkPage sets this once its layout.md has loaded, cleared
  // by the route-change effect below so a stale title never flashes on
  // the next page.
  const [workTitle, setWorkTitle] = useState<string | null>(null)

  // Single CMD+K dialog (CommandPalette) now owns both search and chat —
  // PromptComponent's separate docked/floating panel has been retired.
  // paletteMode is which mode the dialog opens into, but CMD+K itself
  // never touches it — the user should always pick back up in whichever
  // mode they last left the dialog in, search or chat. Only a direct chat
  // trigger (the "Let's Chat" CTA, overlay menu) forces it to 'chat' via
  // openChat(); CommandPalette itself updates paletteMode as the user
  // switches modes inside the dialog (Tab/Back), so this stays in sync
  // for the next open even without a fresh explicit trigger.
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteMode, setPaletteMode] = useState<'search' | 'chat'>('search')

  const openChat = useCallback(() => {
    setPaletteMode('chat')
    setPaletteOpen(true)
  }, [])
  const promptControls = useMemo(() => ({ open: openChat, toggle: openChat }), [openChat])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (!isCmdK) return
      e.preventDefault()
      setPaletteOpen(o => !o)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const allWorkCards = useWorkIndex({ featuredOnly: false })
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const tabs = useMemo(() => {
    const counts = new Map<string, number>()
    for (const card of allWorkCards) {
      if (!card.type) continue
      counts.set(card.type, (counts.get(card.type) ?? 0) + 1)
    }
    const order = ['Brand', 'Product']
    return order
      .filter(label => counts.has(label))
      .map(label => ({ label, count: counts.get(label)! }))
  }, [allWorkCards])
  const filteredWorkCards = useMemo(
    () => activeTab
      ? allWorkCards.filter(c => c.type === activeTab)
      : allWorkCards,
    [allWorkCards, activeTab]
  )

  // What the chat can "see" — the route plus whatever work is on screen.
  const pageContext = usePageContext(filteredWorkCards, activeTab)

  useEffect(() => {
    document.body.dataset.page = location.pathname === '/about' ? 'about' : ''
    setTooltipVisible(false)
  }, [location.pathname])

  useEffect(() => {
    if (location.pathname === displayLocation.pathname) return
    if (!location.pathname.startsWith('/work/')) {
      pendingTheme.current = null
      setWorkTitle(null)
    }

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
    const applied = THEMING_ENABLED ? theme : null
    pendingTheme.current = applied
    if (!fading) applyTheme(applied)
  }

  return (
    <PromptContext.Provider value={promptControls}>
    <CardTooltipContext.Provider value={{ onEnter, onLeave }}>
      <div className="shell">
      <Nav tabs={tabs} totalCount={allWorkCards.length} activeTab={activeTab} onTabChange={setActiveTab} workTitle={workTitle} onOpenPalette={() => setPaletteOpen(true)} />
      <NavMobile workTitle={workTitle} onOpenPalette={() => setPaletteOpen(true)} />
      <div className="app">
        <div
          key={displayLocation.pathname}
          style={{ width: '100%', opacity: fading ? 0 : 1, transition: 'opacity 0.28s ease' }}
        >
          <Routes location={displayLocation}>
            <Route path="/" element={
              <Home
                cards={filteredWorkCards}
                tabs={tabs}
                totalCount={allWorkCards.length}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            } />
            <Route path="/about" element={<About />} />
            <Route path="/work" element={<Navigate to="/" replace />} />
            <Route path="/work/:slug" element={<WorkPage onTheme={handleTheme} onTitle={setWorkTitle} />} />
            <Route path="/archives" element={<Archives />} />
            <Route path="/toast-demo" element={<ToastDemo />} />
            <Route path="/prompt-demo" element={<PromptDemo />} />
            {/* Unknown URLs fall back to the work index rather than a blank page. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      </div>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        cards={allWorkCards}
        pageContext={pageContext}
        initialMode={paletteMode}
        onModeChange={setPaletteMode}
      />
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
    </PromptContext.Provider>
  )
}

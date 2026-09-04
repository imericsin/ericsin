import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import NavbarV2, { type TabDef } from './NavbarV2'
import { getNavLabel } from '../lib/navLabel'

// 8 blur layers matching the cleanpixels progressive blur technique
// Each layer covers a 12.5% band, blur doubles each step: 0.195 → 25px.
// Mask direction is "to bottom" — the fader now sits at the bottom of the
// viewport (see .nav-fader in v65.css), so the blur should build toward
// the bottom edge, not the top as when this lived under the nav.
const BLUR_LAYERS = [0.195, 0.39, 0.78, 1.5625, 3.125, 6.25, 12.5, 25].map((blur, i) => {
  const step = 12.5
  const start = i * step
  return {
    blur,
    mask: `linear-gradient(to bottom, rgba(0,0,0,0) ${start}%, rgba(0,0,0,1) ${start + step}%, rgba(0,0,0,1) ${start + step * 2}%, rgba(0,0,0,0) ${start + step * 3}%)`,
  }
})

interface Props {
  tabs?: TabDef[]
  totalCount?: number
  activeTab?: string | null
  onTabChange?: (label: string | null) => void
  workTitle?: string | null
  /** Opens the CMD+K CommandPalette — wired to the new nav "Menu" button
   *  (index page only for now, see node 3583:39446). */
  onOpenPalette?: () => void
}

export default function Nav({ tabs, totalCount, activeTab, onTabChange, workTitle, onOpenPalette }: Props) {
  const { pathname } = useLocation()
  // Bottom fader is visible everywhere except once the user has actually
  // reached the bottom of the page — at that point the real page footer
  // is on screen and the fade would just obscure it for no reason.
  const [atBottom, setAtBottom] = useState(false)

  useEffect(() => {
    function onScroll() {
      const scrollBottom = window.scrollY + window.innerHeight
      setAtBottom(scrollBottom >= document.documentElement.scrollHeight - 1)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    // Page height can grow without a scroll event (e.g. Home's infinite
    // scroll appending cards while already pinned to the bottom) — a
    // resize observer on body re-checks the bottom threshold whenever
    // that happens, so the fader doesn't stay hidden against newly
    // revealed content below where the user was sitting.
    const ro = new ResizeObserver(onScroll)
    ro.observe(document.body)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      ro.disconnect()
    }
  }, [pathname])

  const variant = pathname === '/' ? 'index' : 'about-archives'
  const navLabel = getNavLabel(pathname)

  return (
    <>
    <div className={`nav-fader${atBottom ? '' : ' nav-fader--visible'}`}>
      {BLUR_LAYERS.map(({ blur, mask }, i) => (
        <div key={i} className="nav-fader__blur" style={{
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
          maskImage: mask,
          WebkitMaskImage: mask,
          zIndex: i + 1,
        }} />
      ))}
    </div>
    <nav className="nav anim anim-1">
      <NavbarV2
        variant={variant}
        tabs={variant === 'index' ? tabs : undefined}
        totalCount={totalCount}
        activeTab={activeTab}
        onTabChange={onTabChange}
        workTitle={workTitle}
        navLabel={navLabel}
        onOpenPalette={onOpenPalette}
      />
    </nav>
    </>
  )
}

import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import NavbarV2, { type TabDef } from './NavbarV2'

// 8 blur layers matching the cleanpixels progressive blur technique
// Each layer covers a 12.5% band, blur doubles each step: 0.195 → 25px
const BLUR_LAYERS = [0.195, 0.39, 0.78, 1.5625, 3.125, 6.25, 12.5, 25].map((blur, i) => {
  const step = 12.5
  const start = i * step
  return {
    blur,
    mask: `linear-gradient(to top, rgba(0,0,0,0) ${start}%, rgba(0,0,0,1) ${start + step}%, rgba(0,0,0,1) ${start + step * 2}%, rgba(0,0,0,0) ${start + step * 3}%)`,
  }
})

interface Props {
  tabs?: TabDef[]
  totalCount?: number
  activeTab?: string | null
  onTabChange?: (label: string | null) => void
}

export default function Nav({ tabs, totalCount, activeTab, onTabChange }: Props) {
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [overlayVisible, setOverlayVisible] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 0) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function openMenu() {
    setMenuOpen(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setOverlayVisible(true)))
  }

  function closeMenu() {
    setOverlayVisible(false)
    setTimeout(() => setMenuOpen(false), 320)
  }

  useEffect(() => {
    closeMenu()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const variant = pathname === '/' ? 'index' : 'about-archives'

  return (
    <>
    <div className={`nav-fader${scrolled ? ' nav-fader--visible' : ''}`}>
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
        menuOpen={menuOpen}
        onMenuToggle={menuOpen ? closeMenu : openMenu}
        overlayVisible={overlayVisible}
        onOverlayLinkClick={closeMenu}
      />
    </nav>
    </>
  )
}

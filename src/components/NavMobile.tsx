import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getNavLabel } from '../lib/navLabel'

interface Props {
  // v6.5 only: set while on a case study page — replaces the site
  // identity with an "INDEX / {title}" breadcrumb, LabelMono (see node
  // 3630:108190). Was "Work / {title}" in SF Pro Display before this.
  workTitle?: string | null
  /** Opens the CMD+K CommandPalette — mobile's "Menu" button now matches
   *  desktop's (NavbarV2.tsx), replacing the old hamburger/OverlayNav.
   *  The ⌘K badge itself stays desktop-only (no keyboard shortcut to
   *  advertise on a touch device), so only the "Menu" label renders here. */
  onOpenPalette?: () => void
}

export default function NavMobile({ workTitle, onOpenPalette }: Props) {
  const { pathname } = useLocation()
  const navLabel = getNavLabel(pathname)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8) }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className="nav-mobile">
      <div className={`nav-mobile-inner${scrolled ? ' nav-mobile-inner--scrolled' : ''}`}>
        <Link to="/" className="nav-mobile-identity" aria-label="Home">
          {/* v6.5's mark — CSS-hidden on main, where the text below renders
              as the logo instead (see .nav-mobile-identity__mark in
              v65.css). Always rendered, same as desktop's .nav-identity
              (a permanent separate slot in NavbarV2.tsx) — this used to be
              mutually exclusive with the workTitle/navLabel text below, so
              the mark disappeared entirely on case-study/Archives pages. */}
          <svg className="nav-mobile-identity__mark" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="10" height="10" fill="currentColor" />
          </svg>
          <p className="nav-mobile-name">Eric Sin</p>
          <p className="nav-mobile-title">Brand & Product</p>
        </Link>
        {workTitle ? (
          <div className="nav-label nav-label--mono-crumb nav-label--mobile">
            <Link to="/" className="nav-label__title--link">Index</Link>
            <span className="nav-label__sep">/</span>
            <span className="nav-label__meta">{workTitle}</span>
          </div>
        ) : navLabel ? (
          <div className="nav-label nav-label--mono nav-label--mobile">
            <span className="nav-label__title">{navLabel.title}</span>
            <span className="nav-label__sep">•</span>
            <span className="nav-label__meta">{navLabel.meta}</span>
          </div>
        ) : null}
        <button type="button" className="nav-menu-btn nav-menu-btn--mobile" onClick={onOpenPalette}>
          <span className="nav-menu-btn__label">Menu</span>
        </button>
      </div>
    </nav>
  )
}

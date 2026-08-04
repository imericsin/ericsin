import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import OverlayNav from './OverlayNav'
import MenuIcon from './MenuIcon'

export default function NavMobile() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8) }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function openMenu() {
    setOpen(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
  }

  function closeMenu() {
    setVisible(false)
    setTimeout(() => setOpen(false), 320)
  }

  function handleNavLink() {
    closeMenu()
  }

  // Close on route change
  useEffect(() => {
    closeMenu()
  }, [pathname])

  return (
    <nav className="nav-mobile">
      <div className={`nav-mobile-inner${scrolled ? ' nav-mobile-inner--scrolled' : ''}`}>
        <Link to="/" className="nav-mobile-identity">
          <p className="nav-mobile-name">Eric Sin</p>
          <p className="nav-mobile-title">Brand & Product</p>
        </Link>
        <MenuIcon open={open} onClick={open ? closeMenu : openMenu} />
      </div>

      {open && <OverlayNav visible={visible} onLinkClick={handleNavLink} />}
    </nav>
  )
}

import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLocalTime } from '../hooks/useLocalTime'

const navLinks = [
  { label: 'Work',     href: '/' },
  { label: 'About',    href: '/about' },
  { label: 'Archives', href: '/archives' },
]

const socialLinks = [
  { href: 'https://www.threads.com/@imericsin',       icon: '/assets/icon-th.svg', label: 'Threads' },
  { href: 'https://www.instagram.com/ericysin',       icon: '/assets/icon-ig.svg', label: 'Instagram' },
  { href: 'https://www.linkedin.com/in/quickfox/',    icon: '/assets/icon-li.svg', label: 'LinkedIn' },
  { href: 'https://www.youtube.com/@ericsindesign',   icon: '/assets/icon-yt.svg', label: 'YouTube' },
]

// Exact match only — see Nav.tsx; a case study isn't the Work page.
function isActive(href: string, pathname: string) {
  return pathname === href
}

export default function NavMobile() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { stamp, location } = useLocalTime()

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
        <button
          className={`nav-mobile-menu${open ? ' nav-mobile-menu--open' : ''}`}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={open ? closeMenu : openMenu}
        >
          <span className="nav-mobile-menu__line nav-mobile-menu__line--top" />
          <span className="nav-mobile-menu__line nav-mobile-menu__line--bot" />
        </button>
      </div>

      {open && (
        <div className={`mnav-panel${visible ? ' mnav-panel--open' : ''}`}>
          {/* Nav links */}
          <div className="mnav-links">
            {navLinks.map(({ label, href }, i) => {
              const active = isActive(href, pathname)
              return (
                <Link
                  key={label}
                  to={href}
                  className={`mnav-link${active ? ' mnav-link--active' : ''}`}
                  style={{ animationDelay: visible ? `${i * 0.06}s` : '0s' }}
                  onClick={handleNavLink}
                >
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Footer */}
          <div className="mnav-footer" style={{ animationDelay: visible ? '0.3s' : '0s' }}>
            <div className="mnav-social">
              {socialLinks.map(({ href, icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="mnav-social-link" aria-label={label}>
                  <img src={icon} alt="" width="16" height="16" style={{ filter: 'invert(1)' }} />
                </a>
              ))}
            </div>
            <div className="mnav-time">
              <p className="mnav-time-val">{stamp}</p>
              <p className="mnav-time-loc">{location}</p>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
// Parked with the ⌘K handler below — kept out of the bundle while unmounted
// so cmdk isn't shipped. Restore alongside the listener and the JSX mount.
// import CommandPalette from './CommandPalette'

const navLinks = [
  { label: 'Work',     href: '/' },
  { label: 'About',    href: '/about' },
  { label: 'Archives', href: '/archives' },
]

// Exact match only — a case study at /work/:slug is its own destination, so
// "Work" shouldn't read as the current page while you're inside one.
function isActive(href: string, pathname: string) {
  return pathname === href
}

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

export default function Nav() {
  const { pathname } = useLocation()
  const [cmdOpen, setCmdOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 0) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ⌘K is parked while the command palette gets a new UI. The component and
  // its styles are kept intact — re-enable by restoring this listener and the
  // <CommandPalette> mount below.
  // useEffect(() => {
  //   function onKey(e: KeyboardEvent) {
  //     if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
  //       e.preventDefault()
  //       setCmdOpen(o => !o)
  //     }
  //     if (e.key === 'Escape') setCmdOpen(false)
  //   }
  //   window.addEventListener('keydown', onKey)
  //   return () => window.removeEventListener('keydown', onKey)
  // }, [])

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
      <div className="nav-inner">
      <div className="nav-logo-fill">
        <Link to="/" className="nav-identity" aria-label="Home">
          <span className="nav-identity__name">Eric Sin</span>
          <span className="nav-identity__title">Brand &amp; Product</span>
        </Link>
      </div>

      <div className="nav-links-fill">
        {navLinks.map(({ label, href }) => {
          const active = isActive(href, pathname)
          return (
            <div key={label} className="nav-link-wrap">
              <Link className={`nav-link${active ? ' active' : ''}`} to={href}>{label}</Link>
            </div>
          )
        })}
      </div>

      {/* <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} /> */}
      </div>
    </nav>
    </>
  )
}

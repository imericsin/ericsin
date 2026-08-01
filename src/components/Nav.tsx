import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import CommandPalette from './CommandPalette'

const navLinks = [
  { label: 'Index',    href: '/' },
  { label: 'Work',     href: '/work' },
  { label: 'About',    href: '/about' },
  { label: 'Archives', href: '/archives' },
]

function isActive(href: string, pathname: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(o => !o)
      }
      if (e.key === 'Escape') setCmdOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
        <Link to="/" aria-label="Home">
          <svg className="nav-logo" width="62" height="18" viewBox="0 0 62 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <g clipPath="url(#navclip)">
              <g transform="translate(0 1)">
                <path d="M57.1973 13.5347C54.6484 13.5347 52.7881 11.7402 52.7881 8.15869V8.14404C52.7881 4.67969 54.4653 2.59961 57.2192 2.59961C59.2627 2.59961 60.8008 3.77881 61.1157 5.41211L61.1304 5.48535H58.9478L58.9258 5.41943C58.6621 4.78223 58.0762 4.3501 57.2119 4.3501C55.6665 4.3501 54.9927 5.82227 54.9121 7.68994C54.9048 7.83643 54.8975 7.98291 54.8975 8.09277H54.9414C55.3589 7.11133 56.3989 6.39355 57.8272 6.39355C59.8706 6.39355 61.2695 7.84375 61.2695 9.82129V9.83594C61.2695 11.9966 59.5483 13.5347 57.1973 13.5347ZM55.2344 9.88721C55.2344 10.9492 56.084 11.7769 57.168 11.7769C58.2446 11.7769 59.1162 10.9565 59.1162 9.9165V9.90186C59.1162 8.80322 58.2886 8.02686 57.1899 8.02686C56.084 8.02686 55.2344 8.7959 55.2344 9.87256V9.88721Z" fill="currentColor"/>
                <path d="M44.2114 13.4414V11.9253L47.9468 8.43164C49.3091 7.15723 49.5947 6.63721 49.5947 5.90479V5.89014C49.5874 5.02588 48.9282 4.41064 47.9907 4.41064C46.9067 4.41064 46.1743 5.12109 46.145 6.07324L46.1377 6.13916H44.0869V6.08057C44.0869 4.08838 45.7422 2.68945 47.9761 2.68945C50.21 2.68945 51.748 3.96387 51.748 5.76562V5.78027C51.748 7.06201 51.1401 7.89697 49.3164 9.57422L47.1045 11.5957V11.6836H51.8945V13.4414H44.2114Z" fill="currentColor"/>
                <path d="M27.5947 8.99854V7.13086H42.1494V8.99854H27.5947Z" fill="currentColor"/>
                <path d="M25.6572 16.1323H21.5996V14.5576H23.6064V1.57471H21.5996V0H25.6572V16.1323Z" fill="currentColor"/>
                <path d="M16.9785 13.5347C14.4663 13.5347 12.8477 12.3848 12.7231 10.4365L12.7158 10.3193H14.8032L14.8179 10.3999C14.957 11.2202 15.8286 11.7329 17.0371 11.7329C18.2603 11.7329 19.0293 11.1982 19.0293 10.3926V10.3853C19.0293 9.66748 18.5093 9.30859 17.1982 9.0376L16.085 8.81787C13.9976 8.40039 12.9429 7.4043 12.9429 5.81494V5.80762C12.9429 3.87402 14.6274 2.59961 16.9712 2.59961C19.4175 2.59961 20.9189 3.82275 21.0215 5.67578L21.0288 5.81494H18.9414L18.9341 5.72705C18.8242 4.89941 18.0625 4.39404 16.9712 4.39404C15.8359 4.40137 15.1548 4.92139 15.1548 5.67578V5.68311C15.1548 6.34961 15.6968 6.73779 16.9126 6.97949L18.0332 7.20654C20.2451 7.646 21.2412 8.54688 21.2412 10.2095V10.2168C21.2412 12.2456 19.6445 13.5347 16.9785 13.5347Z" fill="currentColor"/>
                <path d="M4.81934 13.3521V2.7832H11.8213V4.60693H7.03125V7.14111H11.5503V8.86963H7.03125V11.5283H11.8213V13.3521H4.81934Z" fill="currentColor"/>
                <path d="M0 16.1323V0H4.05762V1.57471H2.05811V14.5576H4.05762V16.1323H0Z" fill="currentColor"/>
              </g>
            </g>
            <defs>
              <clipPath id="navclip">
                <rect width="61.2695" height="18" fill="white"/>
              </clipPath>
            </defs>
          </svg>
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

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      </div>
    </nav>
    </>
  )
}

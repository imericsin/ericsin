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

interface Props {
  visible: boolean
  desktop?: boolean
  onLinkClick: () => void
}

export default function OverlayNav({ visible, desktop = false, onLinkClick }: Props) {
  const { pathname } = useLocation()
  const { stamp, location } = useLocalTime()

  return (
    <div className={`mnav-panel${desktop ? ' mnav-panel--desktop' : ''}${visible ? ' mnav-panel--open' : ''}`}>
      <div className="mnav-links">
        {navLinks.map(({ label, href }, i) => {
          const active = isActive(href, pathname)
          return (
            <Link
              key={label}
              to={href}
              className={`mnav-link${active ? ' mnav-link--active' : ''}`}
              style={{ animationDelay: visible ? `${i * 0.06}s` : '0s' }}
              onClick={onLinkClick}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {!desktop && (
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
      )}
    </div>
  )
}

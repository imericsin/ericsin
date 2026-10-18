import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useNavTone } from './useNavTone'

// Shared v8 chrome (header, footer, social links) used by HomeV8 and
// WorkPageV8. Styles live in v8.css under html.v8-site.

export const CONTACT_EMAIL = 'hello@ericsin.com'

// TODO: the YouTube URL is a placeholder — not in the design or repo.
const SOCIAL = {
  threads: { label: 'Threads', href: 'https://www.threads.com/@imericsin' },
  instagram: { label: 'Instagram', href: 'https://www.instagram.com/imericsin' },
  linkedin: { label: 'LinkedIn', href: 'https://linkedin.com/in/quickfox' },
  youtube: { label: 'YouTube', href: 'https://www.youtube.com' },
}

export const SOCIAL_ICONS = [
  { ...SOCIAL.threads, icon: '/v8/icon-th.svg' },
  { ...SOCIAL.instagram, icon: '/v8/icon-ig.svg' },
  { ...SOCIAL.linkedin, icon: '/v8/icon-li.svg' },
  { ...SOCIAL.youtube, icon: '/v8/icon-yt.svg' },
]

const FOOTER_SOCIAL = [
  { ...SOCIAL.linkedin, short: 'LI' },
  { ...SOCIAL.youtube, short: 'YT' },
  { ...SOCIAL.threads, short: 'TH' },
  { ...SOCIAL.instagram, short: 'IG' },
]

const BUILD = __GIT_COMMIT_SHA__ || 'local'

const FOOTER_FOXES = ['/v8/fox-1.svg', '/v8/fox-2.svg', '/v8/fox-3.svg', '/v8/fox-4.svg']

// html.v8-site scopes every rule in v8.css and hides the shared v6.5
// chrome (nav, framed .app) while a v8 page is mounted.
export function useV8Site() {
  useEffect(() => {
    document.documentElement.classList.add('v8-site')
    return () => document.documentElement.classList.remove('v8-site')
  }, [])
}

function useLocalTime() {
  const format = () => new Date().toLocaleTimeString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
  })
  const [time, setTime] = useState(format)
  useEffect(() => {
    const id = setInterval(() => setTime(format()), 15_000)
    return () => clearInterval(id)
  }, [])
  return time
}

// "Work" goes to the Selected Work section on home (#work). From another
// page, HomeV8 jumps to it on arrival; already on home, scroll in place.
function SiteLinks() {
  const { pathname } = useLocation()
  function onWork(e: React.MouseEvent<HTMLAnchorElement>) {
    if (pathname !== '/' || e.metaKey || e.ctrlKey || e.shiftKey) return
    const target = document.getElementById('work')
    if (!target) return
    e.preventDefault()
    target.scrollIntoView({ behavior: 'smooth' })
    history.replaceState(null, '', '/#work')
  }
  return (
    <nav className="v8-mono v8-stack" aria-label="Site">
      <Link to="/#work" onClick={onWork}>Work</Link>
      <Link to="/about">About</Link>
      <Link to="/archives">Archives</Link>
    </nav>
  )
}

export function SocialIcons() {
  return (
    <div className="v8-social">
      {SOCIAL_ICONS.map(({ icon, label, href }) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
          <img src={icon} alt="" width={18.2609} height={18.2609} />
        </a>
      ))}
    </div>
  )
}


// Progressive blur behind the header: stacked backdrop-filter layers, each
// masked to a band, blur doubling per step — strongest at the top edge,
// fading out downward (same technique as the old .nav-fader, but gentler).
const BLUR_STEPS = [0.25, 0.5, 1, 2, 4, 8]
const BLUR_LAYERS = BLUR_STEPS.map((blur, i) => {
  const step = 100 / BLUR_STEPS.length
  const start = i * step
  const mask = `linear-gradient(to top, transparent ${start}%, #000 ${start + step}%, #000 ${start + step * 2}%, transparent ${start + step * 3}%)`
  return { blur, mask }
})

function V8Header({ page }: { page?: string }) {
  const ref = useRef<HTMLElement>(null)
  useNavTone(ref, page)

  // Publish the header's height so full-bleed heroes can tuck under it.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const root = document.documentElement
    const ro = new ResizeObserver(() => root.style.setProperty('--v8-header-h', `${el.offsetHeight}px`))
    ro.observe(el)
    return () => { ro.disconnect(); root.style.removeProperty('--v8-header-h') }
  }, [])

  return (
    <>
    <div className="v8-nav-blur" aria-hidden>
      {BLUR_LAYERS.map(({ blur, mask }) => (
        <div key={blur} style={{
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }} />
      ))}
    </div>
    <header ref={ref} className="v8-header v8-row">
      <Link to="/" className="v8-mono v8-stack v8-col-name">
        <span>Eric Sin</span>
        <span>Designer</span>
      </Link>
      <div className="v8-mono v8-stack v8-col-bio">
        <p>Orange County, CA</p>
        <p className="v8-origin">
          <img src="/v8/flag.svg" alt="" width={23.3359} height={14.0016} />
          ‘89—South Korea
        </p>
      </div>
      <div className="v8-col-nav"><SiteLinks /></div>
      <div className="v8-mono v8-stack v8-col-contact">
        <p>Contact</p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </div>
    </header>
    </>
  )
}

// The site header, rendered once by App outside the page transition so it
// persists across routes instead of blurring out and back in with each
// page. Its own sticky wrapper keeps it pinned (sticky only sticks within
// its parent). `page` is the displayed route, so the black/white tone
// re-checks as soon as new content swaps in.
export function V8Chrome({ page }: { page: string }) {
  return (
    <div className="v8 v8-chrome">
      <V8Header page={page} />
    </div>
  )
}

export function V8Footer() {
  const time = useLocalTime()
  return (
    <footer className="v8-footer">
      <div className="v8-row">
        {/* Mobile only: the one-row mobile header drops contact, so it
            lands here instead. */}
        <div className="v8-mono v8-stack v8-show-mobile v8-footer__m-contact">
          <p>Contact</p>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </div>
        <div className="v8-mono v8-stack v8-col-name">
          <p>© 2026 Eric Sin</p>
          <p>Selected works</p>
        </div>
        <div className="v8-mono v8-stack v8-col-bio">
          <p>Local time (PST)</p>
          <p>{time}</p>
        </div>
        <div className="v8-mono v8-stack v8-col-nav v8-hide-mobile">
          <p>Build</p>
          <p>{BUILD}</p>
        </div>
        <div className="v8-mono v8-stack v8-col-contact">
          <p>Social</p>
          <nav className="v8-footer__social" aria-label="Social">
            {FOOTER_SOCIAL.map(({ label, short, href }, i) => (
              <span key={label}>
                {i > 0 && <span className="v8-muted" aria-hidden>/</span>}
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>{short}</a>
              </span>
            ))}
          </nav>
        </div>
      </div>
      <div className="v8-row v8-footer__sign">
        <p className="v8-footer__title v8-col-name">Thanks for stopping by.</p>
        <div className="v8-footer__foxes">
          {FOOTER_FOXES.map((src, i) => (
            <div className={`v8-footer__fox v8-footer__fox--${i + 1}`} key={src}>
              <img src={src} alt="" />
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}

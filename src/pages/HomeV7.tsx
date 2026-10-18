import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import { usePrompt } from '../lib/promptContext'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { useReveal } from '../hooks/useReveal'
import { BASE_DELAY, STEP } from '../lib/revealDelay'
import type { WorkCard } from '../hooks/useWorkIndex'
import threadsIcon from '../assets/icons/social/threads.svg'
import instagramIcon from '../assets/icons/social/instagram.svg'
import linkedinIcon from '../assets/icons/social/linkedin.svg'
import youtubeIcon from '../assets/icons/social/youtube.svg'

const SOCIAL_LINKS = [
  { icon: threadsIcon, label: 'Threads', href: 'https://www.threads.com/@imericsin' },
  { icon: instagramIcon, label: 'Instagram', href: 'https://www.instagram.com/imericsin' },
  { icon: linkedinIcon, label: 'LinkedIn', href: 'https://linkedin.com/in/quickfox' },
  { icon: youtubeIcon, label: 'YouTube', href: 'https://www.youtube.com' },
]

// Same tiers as v65.css: desktop >1199px, tablet 720–1199px, mobile ≤719px.
function useColumnCount() {
  const calc = () =>
    typeof window === 'undefined' ? 3
      : window.matchMedia('(min-width: 1200px)').matches ? 3
      : window.matchMedia('(min-width: 720px)').matches ? 2 : 1
  const [count, setCount] = useState(calc)
  useEffect(() => {
    const onChange = () => setCount(calc())
    const queries = [window.matchMedia('(min-width: 1200px)'), window.matchMedia('(min-width: 720px)')]
    queries.forEach(q => q.addEventListener('change', onChange))
    return () => queries.forEach(q => q.removeEventListener('change', onChange))
  }, [])
  return count
}

function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="v7-label">
      <p className="v7-label__index">{index}</p>
      <p className="v7-label__text">{label}</p>
    </div>
  )
}

interface Props {
  cards: WorkCard[]
}

export default function HomeV7({ cards }: Props) {
  const { open: openChat } = usePrompt()

  // Edge-to-edge redesign: html.v7-home scopes every rule in v7.css and
  // lets it hide the v6.5 chrome (nav, framed .app) on this route only.
  useEffect(() => {
    document.documentElement.classList.add('v7-home')
    return () => document.documentElement.classList.remove('v7-home')
  }, [])

  const ordered = useMemo(
    () => [...cards.filter(c => c.featured), ...cards.filter(c => !c.featured)],
    [cards]
  )
  const { visible, sentinelRef, hasMore } = useInfiniteScroll(ordered, 9, 3)
  useReveal([visible.length])

  // Round-robin split so date order reads left→right, top→bottom.
  const colCount = useColumnCount()
  const columns = useMemo(() => {
    const cols: WorkCard[][] = Array.from({ length: colCount }, () => [])
    visible.forEach((c, i) => cols[i % colCount].push(c))
    return cols
  }, [visible, colCount])

  return (
    <div className="v7">
      <header className="v7-nav">
        <Link to="/" className="v7-nav__name">Eric Sin</Link>
        <nav className="v7-nav__links">
          <Link to="/about">About</Link>
          <Link to="/archives">Archives</Link>
          <button type="button" onClick={openChat}>Contact</button>
        </nav>
      </header>

      <section className="v7-hero" aria-label="Designer, Director & Creator">
        <img className="v7-hero__text v7-hero__text--wide" src="/v7/hero-text.svg" alt="Designer, Director & Creator" />
        <img className="v7-hero__text v7-hero__text--stacked" src="/v7/hero-text-mobile.svg" alt="" aria-hidden />
        <div className="v7-hero__stage">
          <img className="v7-hero__fox" src="/v7/fox.png" alt="" />
        </div>
      </section>

      <section className="v7-section">
        <SectionLabel index="01" label="Overview" />
        <div className="v7-overview">
          <div className="v7-overview__photo">
            <img src="/v7/headshot.jpg" alt="Eric Sin" />
          </div>
          <div className="v7-overview__copy">
            <div className="v7-copy">
              <p>
                Hi, my name is Eric, and I’m currently working as a Staff Product Designer at{' '}
                <span className="v7-chip"><img src="/v7/netflix.png" alt="" />Netflix.</span>
              </p>
              <p>I love everything across brand and product design, and thrive in building thoughtful systems in 0-1 spaces.</p>
              <p>
                Learn more <Link to="/about">about me</Link>, scroll through my{' '}
                <Link to="/archives">archives</Link>, or connect with me.
              </p>
            </div>
            <div className="v7-social">
              {SOCIAL_LINKS.map(({ icon, label, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                  <img src={icon} alt="" />
                </a>
              ))}
            </div>
          </div>
          <aside className="v7-notice">
            <p className="v7-notice__title">Notice</p>
            <p className="v7-notice__body">This build is still a work-in-progress. You may notice some bugs—sorry!</p>
          </aside>
        </div>
      </section>

      <section className="v7-section">
        <SectionLabel index="02" label="Work" />
        <div className="v7-works">
          {columns.map((col, c) => (
            <div className="v7-works__col" key={c}>
              {col.map((card, r) => {
                const animated = r < 2
                return (
                  <Card
                    key={card.slug}
                    name={card.name}
                    title={card.name}
                    type={card.type}
                    dateRange={card.dateRange}
                    thumb={card.thumb}
                    thumbType={card.thumbType}
                    slug={card.slug}
                    href={`/work/${card.slug}`}
                    className={animated ? 'anim' : 'reveal'}
                    style={animated ? { animationDelay: `${BASE_DELAY + (r * colCount + c) * STEP}s` } : undefined}
                  />
                )
              })}
            </div>
          ))}
        </div>
        {hasMore && <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />}
      </section>

      <footer className="v7-footer">
        <div className="v7-footer__fox">
          <img className="v7-footer__fox--wide" src="/v7/fox-footer.svg" alt="" />
          <img className="v7-footer__fox--stacked" src="/v7/fox-footer-mobile.svg" alt="" />
        </div>
        <div className="v7-footer__text">
          <p className="v7-footer__title">Thanks for stopping by.</p>
          <p className="v7-footer__copy">© 2026 Eric Sin — Selected Works</p>
        </div>
      </footer>
    </div>
  )
}

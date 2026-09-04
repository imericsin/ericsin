import { useEffect, useRef, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import PageFooter from '../components/PageFooter'
import Tab from '../components/Tab'
import type { TabDef } from '../components/NavbarV2'
import type { WorkCard } from '../hooks/useWorkIndex'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { useReveal } from '../hooks/useReveal'
import { BASE_DELAY, STEP } from '../lib/revealDelay'
import threadsIcon from '../assets/icons/social/threads.svg'
import instagramIcon from '../assets/icons/social/instagram.svg'
import linkedinIcon from '../assets/icons/social/linkedin.svg'
import youtubeIcon from '../assets/icons/social/youtube.svg'

const SOCIAL_LINKS = [
  { icon: threadsIcon, label: 'Threads', href: 'https://www.threads.com/@imericsin' },
  { icon: instagramIcon, label: 'Instagram', href: 'https://www.instagram.com/imericsin' },
  { icon: linkedinIcon, label: 'LinkedIn', href: 'https://www.linkedin.com/in/ericsin' },
  { icon: youtubeIcon, label: 'YouTube', href: 'https://www.youtube.com' },
]

// Baked in at build time (see vite.config.ts) from Vercel's own
// VERCEL_GIT_COMMIT_SHA — empty locally, where there's no Vercel env.
const DEPLOY_ID = __GIT_COMMIT_SHA__ || 'dev'

function FooterClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 30)
    return () => clearInterval(id)
  }, [])
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="home-footer-rows">
      <div className="home-footer-row">
        <p className="home-footer-row__label">Local Time</p>
        <p className="home-footer-row__value">{time}</p>
      </div>
      <div className="home-footer-row">
        <p className="home-footer-row__label">Area</p>
        <p className="home-footer-row__value">Anaheim, CA</p>
      </div>
      <div className="home-footer-row">
        <p className="home-footer-row__label">Version</p>
        <p className="home-footer-row__value">6.{DEPLOY_ID}</p>
      </div>
      <div className="home-footer-spacer" />
      <div className="home-footer-copyright">
        <p>© 2026  Eric Sin — Selected Works</p>
      </div>
    </div>
  )
}


interface Props {
  cards: WorkCard[]
  tabs?: TabDef[]
  totalCount?: number
  activeTab?: string | null
  onTabChange?: (label: string | null) => void
}

export default function Home({ cards: allCards, tabs, totalCount = 0, activeTab = null, onTabChange }: Props) {
  // Featured work leads the feed; the rest follows, each group newest-first.
  // The hook already sorted by date, so a stable partition preserves that.
  const ordered = useMemo(
    () => [...allCards.filter(c => c.featured), ...allCards.filter(c => !c.featured)],
    [allCards]
  )
  const { visible: workCards, sentinelRef, hasMore } = useInfiniteScroll(ordered, 8, 4)

  // Re-scan whenever a batch is appended so the new .reveal cards get observed.
  useReveal([workCards.length])

  // Brief flash when the filtered set changes (tab click) so the swap to a
  // different card list reads as a deliberate update, not a static jump —
  // allCards is a new array reference each time App.tsx recomputes the filter.
  const [flash, setFlash] = useState(false)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 200)
    return () => clearTimeout(t)
  }, [allCards])

  // Both columns render the SAME full, date-ordered list in the DOM — no
  // JS split. CSS alone decides what's visible in each column, purely via
  // :nth-child (see .home-cards in v65.css): on desktop, the left column
  // shows only its odd-position children (1,3,5...) and the right column
  // shows only its even-position children (2,4,6...), giving the
  // appearance of a round-robin split without actually duplicating cards
  // in two different DOM shapes. At the single-column breakpoint, the left
  // column's nth-child filter is removed (so all of its children show,
  // reading 1→N in full) and the right column is hidden outright.
  const ANIMATED_ROWS = 4
  function cardEntrance(index: number) {
    if (index >= ANIMATED_ROWS) return { className: 'reveal', style: undefined }
    return {
      className: 'anim',
      style: { animationDelay: `${BASE_DELAY + index * STEP}s` },
    }
  }

  function renderCardColumn(side: 'left' | 'right') {
    return (
      <div className={`home-cards__col home-cards__col--${side}`}>
        {workCards.map((card, i) => {
          // Animation stagger counts only this column's own visible cards
          // (every other one), so the ones actually shown in this column
          // still animate in 1st/2nd/3rd, not skipping beats for the other
          // column's cards sitting between them in the shared full list.
          const entrance = cardEntrance(Math.floor(i / 2))
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
              className={entrance.className}
              style={entrance.style}
            />
          )
        })}
      </div>
    )
  }

  return (
    <>
    <div className="home-layout page-content style-sidebar">
      {/* Left — sticky */}
      <div className="home-left page-content__sidebar">
        <div className="home-left__top">
          <div className="home-bio-section">
            <div className="home-bio-text">
              <p className="home-bio anim" style={{ animationDelay: '0.1s' }}>
                Designer and creative technologist with a specialization in brand &amp; product design systems in 0-1 spaces. I’m based out of OC, California, and currently serving APMC as VP of Design — building VICTORY+
              </p>
              <p className="home-bio-sub anim" style={{ animationDelay: '0.125s' }}>
                Learn more <Link to="/about">about me</Link>, scroll through my <Link to="/archives">archives</Link>, or connect with me below.
              </p>
            </div>
            <div className="home-social-links anim" style={{ animationDelay: '0.15s' }}>
              {SOCIAL_LINKS.map(({ icon, label, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="home-social-link" aria-label={label}>
                  <img src={icon} alt="" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="home-footer-details anim" style={{ animationDelay: '0.3s' }}>
          <FooterClock />
        </div>
      </div>

      {/* Right — scrollable */}
      <div className="home-right page-content__main">
        {tabs && (
          <div className="home-tabs-mobile tab-row anim" style={{ animationDelay: '0.2s' }}>
            <Tab
              label="All"
              count={totalCount}
              active={activeTab === null}
              onClick={() => onTabChange?.(null)}
              size="mobile"
            />
            {tabs.map(({ label, count }) => (
              <Tab
                key={label}
                label={label}
                count={count}
                active={activeTab === label}
                onClick={() => onTabChange?.(label)}
                size="mobile"
              />
            ))}
          </div>
        )}
        <div className={`home-cards${flash ? ' home-cards--flash' : ''}`}>
          {renderCardColumn('left')}
          {renderCardColumn('right')}
        </div>
        {hasMore && <div ref={sentinelRef} className="home-cards-sentinel" aria-hidden />}
      </div>
    </div>
    <PageFooter revealClass="anim" className="footer-mobile--home" />
    </>
  )
}

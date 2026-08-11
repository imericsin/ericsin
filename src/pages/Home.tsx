import { useEffect, useRef, useState, useMemo, lazy, Suspense } from 'react'
import type { LottieRefCurrentProps } from 'lottie-react'

// lottie-web is ~25MB unpacked and drives one 14x14 hover arrow. Splitting it
// out keeps it off the main bundle; the icon already renders only once its
// JSON has been fetched, so nothing appears differently.
const Lottie = lazy(() => import('lottie-react'))
import Card from '../components/Card'
import PageFooter from '../components/PageFooter'
import Tab from '../components/Tab'
import ToastFeed from '../components/ToastFeed'
import type { ToastItem } from '../components/NotificationToast'
import type { TabDef } from '../components/NavbarV2'
import type { WorkCard } from '../hooks/useWorkIndex'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { useReveal } from '../hooks/useReveal'

const HOME_TOAST_ITEMS: ToastItem[] = [
  {
    assetSrc: '/about/photo.jpg',
    copy: "One of my favourite things about my new portfolio is the 20+ years of design snippets in my Archives page.",
    label: '@ericsin • threads',
    href: 'https://www.threads.com/@imericsin',
  },
  {
    assetSrc: '',
    title: 'ToastFeed Component Added',
    copy: 'A simple component to share my latest news.',
    label: 'Site Updates',
    href: '',
  },
  {
    assetSrc: '/about/photo.jpg',
    copy: '"Don\'t be so scared to ask for help, everyone needs it, and you definitely should!"',
    label: 'Post on LinkedIn',
    href: 'https://www.linkedin.com/feed/update/urn:li:activity:7493041079777157120/',
  },
]

function CtaButton() {
  const [hovered, setHovered] = useState(false)
  const [animData, setAnimData] = useState<object | null>(null)
  const lottieRef = useRef<LottieRefCurrentProps>(null)
  const btnRef = useRef<HTMLAnchorElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    fetch('/assets/arrow-lottie.json').then(r => r.json()).then(setAnimData)
  }, [])

  useEffect(() => {
    if (!lottieRef.current) return
    if (hovered) {
      lottieRef.current.setSpeed(0.5)
      lottieRef.current.goToAndPlay(0)
    } else {
      lottieRef.current.goToAndStop(0)
    }
  }, [hovered])

  function updateOrigin(e: React.MouseEvent<HTMLAnchorElement>) {
    const rect = btnRef.current!.getBoundingClientRect()
    fillRef.current!.style.left = `${e.clientX - rect.left}px`
    fillRef.current!.style.top = `${e.clientY - rect.top}px`
  }

  return (
    <a
      ref={btnRef}
      className={`home-cta-btn${hovered ? ' home-cta-btn--hover' : ''}`}
      href="mailto:hello@ericsin.com"
      onMouseEnter={(e) => { updateOrigin(e); setHovered(true) }}
      onMouseLeave={(e) => { updateOrigin(e); setHovered(false) }}
    >
      <span ref={fillRef} className="home-cta-fill" />
      <span className="home-cta-label">Let's Chat</span>
      <span className="home-cta-icon">
        {animData && (
          <Suspense fallback={null}>
            <Lottie lottieRef={lottieRef} animationData={animData} loop={false} autoplay={false} style={{ width: 14, height: 14 }} />
          </Suspense>
        )}
      </span>
    </a>
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
  const { visible: workCards, sentinelRef, hasMore } = useInfiniteScroll(ordered, 4, 3)

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

  return (
    <>
    <div className="home-layout">
      {/* Left — sticky */}
      <div className="home-left">
        <div className="home-left__top">
          <div className="home-bio-section">
            <div className="home-bio-text">
              <p className="home-bio anim" style={{ animationDelay: '0.1s' }}>
                Designer in practice, engineer at heart.<br />20+ years shipping consumer experiences and enterprise software.
              </p>
              <p className="home-bio-sub anim" style={{ animationDelay: '0.125s' }}>
                I believe in design with a purpose—an ideology anchored around community, thoughtfulness, and craft. If that sounds like you, let's build something together.
              </p>
            </div>
            <div className="home-cta-section anim" style={{ animationDelay: '0.15s' }}>
              <CtaButton />
              <div className="home-cta-availability">
                <p className="home-cta-avail-label">Current Role</p>
                <p className="home-cta-avail-status">VP, Design @ APMC</p>
              </div>
            </div>
          </div>
        </div>

        <div className="home-footer-details anim" style={{ animationDelay: '0.3s' }}>
          <ToastFeed items={HOME_TOAST_ITEMS} />
        </div>
      </div>

      {/* Right — scrollable */}
      <div className="home-right">
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
          {workCards.map((card, i) => (
            <Card
              key={card.slug}
              name={card.name}
              title={card.headliner}
              tags={card.categories}
              dateRange={card.dateRange}
              thumb={card.thumb}
              thumbType={card.thumbType}
              slug={card.slug}
              href={`/work/${card.slug}`}
              // The first batch animates on mount with a stagger. Appended
              // cards use .reveal instead so each fades in when it actually
              // scrolls into view — the sentinel fires 600px early, so a
              // mount animation would finish before the card is ever seen.
              className={i < 4 ? 'anim' : 'reveal'}
              style={i < 4 ? { animationDelay: `${0.25 + i * 0.06}s` } : undefined}
            />
          ))}
        </div>
        {hasMore && <div ref={sentinelRef} className="home-cards-sentinel" aria-hidden />}
      </div>
    </div>
    <PageFooter revealClass="anim" className="footer-mobile--home" />
    </>
  )
}

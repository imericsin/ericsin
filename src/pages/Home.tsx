import { useEffect, useRef, useState, useMemo, lazy, Suspense } from 'react'
import type { LottieRefCurrentProps } from 'lottie-react'

// lottie-web is ~25MB unpacked and drives one 14x14 hover arrow. Splitting it
// out keeps it off the main bundle; the icon already renders only once its
// JSON has been fetched, so nothing appears differently.
const Lottie = lazy(() => import('lottie-react'))
import Card from '../components/Card'
import PageFooter from '../components/PageFooter'
import Tab from '../components/Tab'
import type { TabDef } from '../components/NavbarV2'
import type { WorkCard } from '../hooks/useWorkIndex'
import { useLocalTime } from '../hooks/useLocalTime'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { useReveal } from '../hooks/useReveal'

// Social icons inlined as SVG so `fill="currentColor"` lets CSS drive the
// color. An <img> can't be recolored from outside, and a filter chain can't
// hit an arbitrary hex accurately. Hover is scoped by the parent link, so
// each icon reacts independently.
const SOCIAL_ICONS: Record<string, string> = {
  th: 'M11.6525 7.06108C11.6333 4.84312 10.4309 3.50659 8.3998 3.50659C7.04411 3.50659 5.904 4.11976 5.30518 5.09702L6.61776 6.01199C6.95788 5.47546 7.42734 5.02995 8.28962 5.02995C9.26207 5.02995 9.76506 5.57126 9.90878 6.57726C9.43931 6.50541 8.96985 6.46709 8.48602 6.46709C5.86087 6.46709 4.62493 7.65511 4.62493 9.22636C4.62493 10.8264 5.86087 11.7653 7.68123 11.7653C9.67884 11.7653 10.8717 10.4192 11.3603 8.75211C11.8681 8.98205 12.2178 9.51858 12.2178 10.3234C12.2178 12.4791 9.73154 13.6527 7.62375 13.6527C4.51476 13.6527 2.48362 11.612 2.48362 8.29223C2.48362 4.22516 5.17104 1.61917 8.78303 1.61917C11.207 1.61917 12.4046 2.68265 13.219 4.11019L14.5603 3.17126C13.6741 1.32216 11.6956 0 8.72554 0C3.99261 0 0.773438 3.35809 0.773438 8.22996C0.773438 12.6851 3.92554 15.2719 7.68123 15.2719C10.7854 15.2719 13.9232 13.4611 13.9232 10.3617C13.9232 8.74253 12.9938 7.66946 11.6525 7.06108ZM7.62375 10.1509C6.93872 10.1509 6.33513 9.82516 6.33513 9.22635C6.33513 8.28263 7.49442 7.99521 8.62974 7.99521C9.06088 7.99521 9.48244 8.02394 9.85609 8.10539C9.58783 9.33174 8.79261 10.1509 7.62375 10.1509Z',
  ig: 'M4.68687 0.0559518C3.83565 0.096113 3.25435 0.231957 2.74618 0.431643C2.22024 0.636609 1.77447 0.911658 1.33093 1.35679C0.8874 1.80192 0.614272 2.24802 0.410745 2.77475C0.213779 3.28405 0.0803354 3.86583 0.0427343 4.71753C0.00513313 5.56924 -0.00318712 5.84301 0.000973001 8.01555C0.00513313 10.1881 0.0147334 10.4604 0.0560147 11.3139C0.0966559 12.165 0.23202 12.7461 0.431706 13.2544C0.636992 13.7804 0.91172 14.226 1.35701 14.6697C1.80231 15.1134 2.24808 15.3859 2.7761 15.5897C3.28491 15.7863 3.86685 15.9204 4.7184 15.9577C5.56994 15.995 5.84403 16.0036 8.01594 15.9995C10.1878 15.9953 10.4613 15.9857 11.3146 15.9452C12.1679 15.9047 12.746 15.7684 13.2545 15.5697C13.7804 15.3639 14.2264 15.0897 14.6697 14.6442C15.1131 14.1988 15.3861 13.7524 15.5894 13.2253C15.7866 12.7165 15.9205 12.1346 15.9575 11.2836C15.9947 10.4297 16.0035 10.1571 15.9994 7.98483C15.9952 5.81261 15.9855 5.54028 15.945 4.68713C15.9045 3.83399 15.769 3.25461 15.5694 2.74595C15.3638 2.22002 15.0894 1.77472 14.6443 1.33071C14.1992 0.886697 13.7524 0.613889 13.2255 0.411002C12.7164 0.214037 12.1348 0.0797925 11.2832 0.0429914C10.4317 0.00619028 10.1576 -0.00325001 7.98489 0.000910117C5.81219 0.00507024 5.54018 0.0143505 4.68687 0.0559518ZM4.78032 14.5185C4.00029 14.4845 3.57676 14.3549 3.29451 14.2465C2.92074 14.1025 2.65449 13.9284 2.3732 13.6498C2.09192 13.3712 1.91911 13.104 1.77319 12.7311C1.66358 12.4488 1.53158 12.0258 1.4951 11.2457C1.45542 10.4027 1.4471 10.1495 1.44246 8.01363C1.43782 5.87773 1.44598 5.62492 1.48294 4.78153C1.51622 4.00215 1.64662 3.57814 1.75495 3.29605C1.89895 2.9218 2.0724 2.65603 2.3516 2.3749C2.63081 2.09377 2.89722 1.92065 3.27051 1.77472C3.55244 1.66464 3.97549 1.53376 4.7552 1.49664C5.5989 1.45663 5.85171 1.44863 7.98729 1.44399C10.1229 1.43935 10.3763 1.44735 11.2204 1.48447C11.9997 1.5184 12.4239 1.64752 12.7057 1.75648C13.0796 1.90049 13.3457 2.07345 13.6268 2.35314C13.908 2.63283 14.0812 2.89828 14.2272 3.27237C14.3374 3.5535 14.4683 3.97639 14.5051 4.75657C14.5453 5.60028 14.5544 5.85325 14.5582 7.98867C14.5621 10.1241 14.5545 10.3777 14.5176 11.2208C14.4835 12.0008 14.3542 12.4245 14.2456 12.7071C14.1016 13.0807 13.928 13.3471 13.6486 13.628C13.3692 13.909 13.1031 14.0821 12.7297 14.2281C12.4481 14.338 12.0245 14.4692 11.2455 14.5063C10.4018 14.546 10.149 14.5543 8.01257 14.5589C5.87619 14.5636 5.62418 14.5549 4.78048 14.5185M11.3023 3.72438C11.3026 3.91427 11.3592 4.0998 11.465 4.25751C11.5707 4.41521 11.7209 4.53801 11.8965 4.61037C12.072 4.68273 12.2651 4.7014 12.4513 4.66403C12.6375 4.62665 12.8084 4.5349 12.9424 4.40038C13.0764 4.26586 13.1675 4.09462 13.2042 3.90831C13.2409 3.722 13.2216 3.52899 13.1485 3.35369C13.0755 3.1784 12.9522 3.02869 12.7941 2.9235C12.636 2.81832 12.4503 2.76237 12.2604 2.76275C12.0058 2.76326 11.7619 2.86485 11.5822 3.04518C11.4025 3.22551 11.3018 3.46982 11.3023 3.72438ZM3.89245 8.00819C3.89693 10.2771 5.73955 12.1122 8.00794 12.1078C10.2763 12.1035 12.1127 10.2611 12.1084 7.99219C12.1041 5.72332 10.261 3.88775 7.99225 3.89223C5.72355 3.89671 3.88813 5.73964 3.89245 8.00819ZM5.33345 8.00531C5.33241 7.47787 5.4878 6.96196 5.77996 6.52283C6.07212 6.0837 6.48794 5.74107 6.97484 5.53826C7.46173 5.33545 7.99783 5.28158 8.51534 5.38345C9.03285 5.48533 9.50853 5.73837 9.88222 6.11059C10.2559 6.48281 10.5108 6.95749 10.6148 7.47459C10.7187 7.99169 10.6669 8.528 10.4661 9.01569C10.2652 9.50339 9.92421 9.92056 9.48623 10.2145C9.04826 10.5084 8.53298 10.6658 8.00553 10.6668C7.65531 10.6676 7.30838 10.5993 6.98454 10.4659C6.66071 10.3326 6.36631 10.1367 6.11818 9.88957C5.87005 9.64242 5.67303 9.34881 5.53839 9.0255C5.40374 8.70219 5.3341 8.35553 5.33345 8.00531Z',
  li: 'M13.6328 13.6326H11.2621V9.92001C11.2621 9.0347 11.2463 7.89503 10.0291 7.89503C8.79431 7.89503 8.6054 8.85961 8.6054 9.85555V13.6324H6.23469V5.99773H8.51056V7.04108H8.54242C8.77018 6.65166 9.09931 6.3313 9.49473 6.11412C9.89016 5.89695 10.3371 5.79109 10.7879 5.80783C13.1907 5.80783 13.6338 7.38829 13.6338 9.44438L13.6328 13.6326ZM3.55975 4.95413C3.28765 4.95418 3.02165 4.87354 2.79538 4.72241C2.56911 4.57128 2.39275 4.35645 2.28858 4.10508C2.18441 3.85372 2.15711 3.57711 2.21014 3.31023C2.26318 3.04335 2.39417 2.79819 2.58653 2.60575C2.7789 2.41332 3.02401 2.28225 3.29087 2.22911C3.55773 2.17598 3.83435 2.20318 4.08575 2.30726C4.33716 2.41134 4.55205 2.58764 4.70326 2.81385C4.85447 3.04006 4.9352 3.30604 4.93525 3.57813C4.93529 3.7588 4.89973 3.9377 4.83062 4.10463C4.76151 4.27155 4.66021 4.42323 4.53249 4.55101C4.40476 4.67878 4.2531 4.78014 4.0862 4.84931C3.9193 4.91848 3.74042 4.95409 3.55975 4.95413ZM4.7451 13.6326H2.37193V5.99773H4.7451V13.6326ZM14.8147 0.00109007H1.18066C0.871207 -0.00240211 0.573012 0.117105 0.351627 0.33335C0.130241 0.549596 0.00377671 0.844887 0 1.15434V14.8449C0.00364745 15.1545 0.130038 15.45 0.351416 15.6665C0.572793 15.8829 0.871053 16.0027 1.18066 15.9994H14.8147C15.1249 16.0033 15.424 15.8839 15.6462 15.6674C15.8685 15.4509 15.9957 15.1551 16 14.8449V1.15335C15.9956 0.843286 15.8683 0.547659 15.646 0.331418C15.4237 0.115178 15.1247 -0.00398749 14.8147 0.000101878',
  yt: 'M6.36374 10.3788V5.62072L10.5456 7.99985L6.36374 10.3788ZM15.6659 4.12358C15.4819 3.43066 14.9397 2.88502 14.2513 2.69983C13.0036 2.36328 8.00013 2.36328 8.00013 2.36328C8.00013 2.36328 2.99671 2.36328 1.74893 2.69983C1.06053 2.88502 0.518332 3.43066 0.334345 4.12358C0 5.37945 0 7.99974 0 7.99974C0 7.99974 0 10.62 0.334345 11.8759C0.518332 12.5688 1.06053 13.1145 1.74893 13.2997C2.99671 13.6362 8.00013 13.6362 8.00013 13.6362C8.00013 13.6362 13.0036 13.6362 14.2513 13.2997C14.9397 13.1145 15.4819 12.5688 15.6659 11.8759C16.0003 10.62 16.0003 7.99974 16.0003 7.99974C16.0003 7.99974 16.0003 5.37945 15.6659 4.12358Z',
}

function SocialIcon({ name }: { name: keyof typeof SOCIAL_ICONS }) {
  return (
    <svg
      className="home-social-icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d={SOCIAL_ICONS[name]} fill="currentColor" />
    </svg>
  )
}

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
  const { stamp, location } = useLocalTime()

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
          <div className="home-social">
            <a href="https://www.threads.com/@imericsin" target="_blank" rel="noopener noreferrer" className="home-social-link" aria-label="Threads">
              <SocialIcon name="th" />
            </a>
            <a href="https://www.instagram.com/ericysin" target="_blank" rel="noopener noreferrer" className="home-social-link" aria-label="Instagram">
              <SocialIcon name="ig" />
            </a>
            <a href="https://www.linkedin.com/in/quickfox/" target="_blank" rel="noopener noreferrer" className="home-social-link" aria-label="LinkedIn">
              <SocialIcon name="li" />
            </a>
            <a href="https://www.youtube.com/@ericsindesign" target="_blank" rel="noopener noreferrer" className="home-social-link" aria-label="YouTube">
              <SocialIcon name="yt" />
            </a>
          </div>
          <div className="home-time-wrap">
            <p className="home-date">{stamp}</p>
            <p className="home-location">{location}</p>
          </div>
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

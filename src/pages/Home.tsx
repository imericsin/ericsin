import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import type { LottieRefCurrentProps } from 'lottie-react'

// lottie-web is ~25MB unpacked and drives one 14x14 hover arrow. Splitting it
// out keeps it off the main bundle; the icon already renders only once its
// JSON has been fetched, so nothing appears differently.
const Lottie = lazy(() => import('lottie-react'))
import Card from '../components/Card'
import PageFooter from '../components/PageFooter'
import { useWorkIndex } from '../hooks/useWorkIndex'

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
      href="mailto:eric@2717.design"
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

function useAnaheimTime() {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    function update() {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', {
        timeZone: 'America/Los_Angeles',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }))
      setDate(now.toLocaleDateString('en-US', {
        timeZone: 'America/Los_Angeles',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }))
    }
    update()
    const id = setInterval(update, 10000)
    return () => clearInterval(id)
  }, [])

  return { time, date }
}


export default function Home() {
  const workCards = useWorkIndex({ featuredOnly: true, limit: 4 })
  const { time, date } = useAnaheimTime()

  return (
    <>
    <div className="home-layout">
      {/* Left — sticky */}
      <div className="home-left">
        <div className="home-left__top">
          <div className="home-bio-section">
            <p className="home-bio anim" style={{ animationDelay: '0.1s' }}>
              Designer in practice, engineer at heart.<br />20+ years shipping consumer experiences and enterprise software.
            </p>
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
              <img src="/assets/icon-th.svg" alt="" width="16" height="16" />
            </a>
            <a href="https://www.instagram.com/ericysin" target="_blank" rel="noopener noreferrer" className="home-social-link" aria-label="Instagram">
              <img src="/assets/icon-ig.svg" alt="" width="16" height="16" />
            </a>
            <a href="https://www.linkedin.com/in/quickfox/" target="_blank" rel="noopener noreferrer" className="home-social-link" aria-label="LinkedIn">
              <img src="/assets/icon-li.svg" alt="" width="16" height="16" />
            </a>
            <a href="https://www.youtube.com/@ericsindesign" target="_blank" rel="noopener noreferrer" className="home-social-link" aria-label="YouTube">
              <img src="/assets/icon-yt.svg" alt="" width="16" height="16" />
            </a>
          </div>
          <div className="home-time-wrap">
            <p className="home-date">{date}</p>
            <p className="home-location">Anaheim, California</p>
          </div>
        </div>
      </div>

      {/* Right — scrollable */}
      <div className="home-right">
        <p className="home-cards-label anim" style={{ animationDelay: '0.2s' }}>Latest Work</p>

        <div className="home-cards">
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
              className="anim"
              style={{ animationDelay: `${0.25 + i * 0.06}s` }}
            />
          ))}
        </div>
      </div>
    </div>
    <PageFooter revealClass="anim" className="footer-mobile--home" />
    </>
  )
}

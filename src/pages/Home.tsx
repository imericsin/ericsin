import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Lottie, { type LottieRefCurrentProps } from 'lottie-react'
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
        {animData && <Lottie lottieRef={lottieRef} animationData={animData} loop={false} autoplay={false} style={{ width: 14, height: 14 }} />}
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

const experiences = [
  { title: 'VP, Design',           company: 'A Parent Media Co. Inc.', year: 'Current' },
  { title: 'Sr. Product Designer', company: 'You.com',                 year: '2024' },
  { title: 'Sr. Product Designer', company: 'Mosaic Finance',          year: '2023—2024' },
  { title: 'Sr. Product Designer', company: 'AuditBoard',              year: '2022—2023' },
  { title: 'Design Manager',       company: 'AuditBoard',              year: '2020—2022' },
]

const DEFAULT_OPACITIES = [1, 0.5, 0.25, 0.12, 0.05]

function ExperienceList() {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="exp-section"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="exp-wrap">
        <p className="exp-label">Experience</p>
        <div className={`exp-list${hovered ? ' exp-list--hover' : ''}`}>
          {experiences.map(({ title, company, year }, i) => (
            <div
              key={title + company}
              className="exp-row"
              style={{ opacity: hovered ? 1 : DEFAULT_OPACITIES[i], transition: 'opacity 250ms ease-out' }}
            >
              <span className="exp-title">{title}</span>
              <span className="exp-slash" aria-hidden>/</span>
              <span className="exp-company">{company}</span>
              {(hovered || i === 0) && (
                <>
                  <span className="exp-slash" aria-hidden>/</span>
                  <span className="exp-year">{year}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="exp-cta-wrap">
        <Link to="/about" className={`exp-cta${hovered ? ' exp-cta--visible' : ''}`}><span className="exp-cta-text">See Full Experience</span> →</Link>
      </div>
    </div>
  )
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
          <div className="home-identity anim" style={{ animationDelay: '0.1s' }}>
            <p className="hero-name">Eric Sin</p>
            <p className="hero-title">Brand & Product</p>
          </div>
          <div className="anim" style={{ animationDelay: '0.2s' }}>
            <ExperienceList />
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
        <div className="home-bio-section">
          <p className="home-bio anim" style={{ animationDelay: '0.15s' }}>
            Designer in practice, engineer at heart.<br />20+ years shipping consumer experiences and enterprise software.
          </p>
          <div className="home-cta-section anim" style={{ animationDelay: '0.2s' }}>
            <CtaButton />
            <div className="home-cta-availability">
              <p className="home-cta-avail-label">Current Availability</p>
              <p className="home-cta-avail-status">Open for Work</p>
            </div>
          </div>
        </div>

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

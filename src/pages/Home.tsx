import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import { useWorkIndex } from '../hooks/useWorkIndex'

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
        <Link to="/about" className={`exp-cta${hovered ? ' exp-cta--visible' : ''}`}>See Full Experience →</Link>
      </div>
    </div>
  )
}

export default function Home() {
  const workCards = useWorkIndex({ featuredOnly: true, limit: 4 })
  const { time, date } = useAnaheimTime()

  return (
    <div className="home-layout">
      {/* Left — sticky */}
      <div className="home-left">
        <div className="home-left__top">
          <div className="home-identity anim" style={{ animationDelay: '0.1s' }}>
            <p className="hero-name">Eric Sin</p>
            <p className="hero-title">Designer / Director</p>
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
            Craft-obsessed, multidisciplinary creative thinker specialized in designing digital experiences across industries
          </p>
          <div className="anim" style={{ animationDelay: '0.2s' }}>
            <a className="home-cta-btn" href="mailto:eric@2717.design">Let's Chat</a>
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
  )
}

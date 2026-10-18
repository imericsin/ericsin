import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Card from '../components/Card'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { useV8Reveal } from '../hooks/useReveal'
import { BASE_DELAY, STEP } from '../lib/revealDelay'
import type { WorkCard } from '../hooks/useWorkIndex'
import { SocialIcons, V8Footer, useV8Site } from '../components/v8/Chrome'
import HeroWash from '../components/v8/HeroWash'

// Same tiers as v7: desktop >1199px, tablet 720–1199px, mobile ≤719px.
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

interface Props {
  cards: WorkCard[]
}

export default function HomeV8({ cards }: Props) {
  useV8Site()

  // Arriving via the nav's "Work" link (/#work): jump to Selected Work.
  // Runs after App's route swap has reset scroll to the top.
  const { hash } = useLocation()
  useEffect(() => {
    if (hash !== '#work') return
    const raf = requestAnimationFrame(() => document.getElementById('work')?.scrollIntoView())
    return () => cancelAnimationFrame(raf)
  }, [hash])

  const ordered = useMemo(
    () => [...cards.filter(c => c.featured), ...cards.filter(c => !c.featured)],
    [cards]
  )
  const { visible, sentinelRef, hasMore } = useInfiniteScroll(ordered, 9, 3)
  useV8Reveal([visible.length])

  // Round-robin split so date order reads left→right, top→bottom.
  const colCount = useColumnCount()
  const columns = useMemo(() => {
    const cols: WorkCard[][] = Array.from({ length: colCount }, () => [])
    visible.forEach((c, i) => cols[i % colCount].push(c))
    return cols
  }, [visible, colCount])

  return (
    <div className="v8">

      <section className="v8-hero" aria-label="Designing and building what's next.">
        <HeroWash />
        <div className="v8-hero__stage">
          <img className="v8-hero__word v8-hero__word--1 anim" style={{ animationDelay: '0.1s' }} src="/v8/hero-designing-and.svg" alt="" width={935} height={152} />
          <img className="v8-hero__word v8-hero__word--2 anim" style={{ animationDelay: '0.18s' }} src="/v8/hero-building.svg" alt="" width={545} height={152} />
          <img className="v8-hero__word v8-hero__word--3 anim" style={{ animationDelay: '0.26s' }} src="/v8/hero-whats.svg" alt="" width={420} height={118} />
          <img className="v8-hero__word v8-hero__word--4 anim" style={{ animationDelay: '0.34s' }} src="/v8/hero-next.svg" alt="" width={318.873} height={103.984} />
          <div className="v8-hero__fox anim" style={{ animationDelay: '0.45s' }}>
            <img src="/v8/fox.png" alt="" />
          </div>
        </div>
      </section>

      <section className="v8-section">
        <p className="v8-label">/01. Overview</p>
        <div className="v8-row">
          <div className="v8-col-heading v8-overview__intro">
            {/* One block per sentence, each balanced on its own, so the line
                lengths even out at every width instead of one long middle line. */}
            <h1 className="v8-heading v8-intro">
              <span className="v8-intro__line">
                <span className="v8-muted">Hey, my name is </span><strong>Eric</strong>.
              </span>
              <span className="v8-intro__line">
                <span className="v8-muted">I’m currently at </span>
                {/* Chip + comma never split; the title stays on one line. */}
                <span className="v8-nowrap">
                  <a className="v8-chip" href="https://jobs.netflix.com/culture" target="_blank" rel="noopener noreferrer">
                    <img src="/v8/netflix.png" alt="" width={24} height={24} />
                    <strong>Netflix</strong>
                  </a>
                  <span className="v8-muted">,</span>
                </span>
                <span className="v8-muted"> working as a </span>
                <strong className="v8-nowrap">Staff Product Designer.</strong>
              </span>
            </h1>
            <SocialIcons />
          </div>
          <div className="v8-col-body v8-body">
            <p>
              I believe great experiences start with a strong, well-defined problem and have deep
              conviction in storytelling as a superpower to strengthen and change people, places,
              and products.
            </p>
            <p>
              I do this practically by working as a product designer in my day-to-day on the New
              Content Experiences team at Netflix—where I work on future bets for the constantly
              shifting landscape of streaming entertainment.
            </p>
          </div>
        </div>
      </section>

      <section id="work" className="v8-section v8-section--work">
        <p className="v8-label">/02. work</p>
        <div className="v8-row">
          <h2 className="v8-heading v8-col-heading">
            Selected Work<br />
            <span className="v8-muted v8-medium">2018—2026</span>
          </h2>
          <div className="v8-col-body v8-body">
            <p>
              I enjoy working on projects that are usually highly focused and early-stage. I don’t
              take on many clients anymore, but if you have something interesting, please feel
              free to reach out.
            </p>
          </div>
        </div>
        <div className="v8-works">
          {columns.map((col, c) => (
            <div className="v8-works__col" key={c}>
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

      <V8Footer />
    </div>
  )
}

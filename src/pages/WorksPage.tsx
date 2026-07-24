import React from 'react'
import Card from '../components/Card'
import PageFooter from '../components/PageFooter'
import { useWorkIndex } from '../hooks/useWorkIndex'
import { useReveal } from '../hooks/useReveal'
import { useCardDim } from '../components/CardGrid'

const headlinerLines = [
  'Case studies covering the range',
  'between brand, product, and',
  'leadership in design.',
]

export default function WorksPage() {
  const cards = useWorkIndex({ featuredOnly: false })
  useReveal([cards])
  const { setHoveredIndex, getDimStyle } = useCardDim(cards.length)

  return (
    <div className="page">
      <div className="spacer-4" />

      <section className="section-hero">
        <div className="hero-text hero-text--stack">
          <p className="hero-name anim" style={{ animationDelay: '0.1s' }}>Work</p>
          <p className="hero-bio" aria-label={headlinerLines.join(' ')}>
            {headlinerLines.map((line, i) => (
              <span
                key={i}
                className="hero-line"
                style={{ animationDelay: `${0.15 + i * 0.1}s` }}
              >{line}</span>
            ))}
          </p>
        </div>
      </section>

      <section className="section-cards">
        <div className="card-grid">
          {cards.map((card, i) => (
            <Card
              key={card.slug}
              name={card.name}
              title={card.headliner}
              tags={card.categories}
              thumb={card.thumb}
              thumbType={card.thumbType}
              slug={card.slug}
              href={`/work/${card.slug}`}
              className="reveal"
              style={{ '--reveal-delay': `${i * 0.07}s`, ...getDimStyle(i) } as React.CSSProperties}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </div>
      </section>

      <div className="spacer-4" />

      <PageFooter revealClass="reveal" />
    </div>
  )
}

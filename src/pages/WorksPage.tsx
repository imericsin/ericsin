import React from 'react'
import Card from '../components/Card'
import PageFooter from '../components/PageFooter'
import { useWorkIndex } from '../hooks/useWorkIndex'
import { useReveal } from '../hooks/useReveal'
import { useColumns } from '../hooks/useColumns'
import { diagonalDelay } from '../lib/revealDelay'

// Mirrors .card-grid in globals.css
const CARD_GRID_BREAKPOINTS = [
  { maxWidth: 640, columns: 1 },
  { maxWidth: 860, columns: 2 },
]

export default function WorksPage() {
  const cards = useWorkIndex({ featuredOnly: false })
  const columns = useColumns(CARD_GRID_BREAKPOINTS, 3)
  useReveal([cards])

  return (
    <>
    <div className="page">
      <div className="spacer-4" />

      <section className="section-hero">
        <div className="hero-text hero-text--stack">
          <p className="hero-name anim" style={{ animationDelay: '0.1s' }}>Work</p>
          <p className="hero-bio anim" style={{ animationDelay: '0.2s' }}>
            Case studies covering the range between brand, product, and leadership in design.
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
              className="anim"
              style={{ animationDelay: diagonalDelay(i, columns) }}
            />
          ))}
        </div>
      </section>

      <div className="spacer-4" />
    </div>
    <PageFooter revealClass="reveal" />
    </>
  )
}

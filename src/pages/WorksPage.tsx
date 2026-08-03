import React, { useState, useMemo } from 'react'
import Card from '../components/Card'
import FilterControls from '../components/FilterControls'
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

// Display order for the filter tabs; anything not listed is appended.
const FILTER_ORDER = ['Brand', 'Product', 'Design Systems', 'Web']

function toTags(categories: string): string[] {
  return categories.split(',').map(c => c.trim()).filter(Boolean)
}

export default function WorksPage() {
  const cards = useWorkIndex({ featuredOnly: false })
  const columns = useColumns(CARD_GRID_BREAKPOINTS, 3)
  const [filter, setFilter] = useState<string | null>(null)

  // Only offer filters that at least one case study actually carries.
  const options = useMemo(() => {
    const present = new Set(cards.flatMap(c => toTags(c.categories)))
    const ordered = FILTER_ORDER.filter(f => present.has(f))
    const extra = [...present].filter(f => !FILTER_ORDER.includes(f)).sort()
    return [...ordered, ...extra]
  }, [cards])

  const visible = useMemo(
    () => (filter === null ? cards : cards.filter(c => toTags(c.categories).includes(filter))),
    [cards, filter]
  )

  useReveal([visible])

  return (
    <>
    <div className="page">
      <div className="spacer-4" />

      <section className="section-hero">
        <div className="hero-text hero-text--stack">
          <p className="hero-name anim" style={{ animationDelay: '0.1s' }}>Work</p>
          <p className="hero-bio anim" style={{ animationDelay: '0.2s' }}>
            Case studies covering the range between brand, product, and leadership in design organizations.
          </p>
        </div>
      </section>

      <section className="section-cards">
        <FilterControls
          options={options}
          active={filter}
          onChange={setFilter}
          className="anim"
          style={{ animationDelay: '0.25s' }}
        />

        <div className="card-grid">
          {visible.map((card, i) => (
            <Card
              // Keyed by filter so cards remount and replay their entry
              // animation — Card strips .anim from the DOM on animation end.
              key={`${filter ?? 'all'}-${card.slug}`}
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

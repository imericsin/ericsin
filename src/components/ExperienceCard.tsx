import { useState } from 'react'

interface Props {
  name: string
  role: string
  status?: string | null
  paras: string[]
  defaultExpanded?: boolean
}

export default function ExperienceCard({ name, role, status, paras, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <button
      type="button"
      className={`exp-card${expanded ? ' exp-card--expanded' : ''}`}
      onClick={() => setExpanded(e => !e)}
      aria-expanded={expanded}
    >
      <div className="exp-card__row">
        <div className="exp-card__label-col">
          {status && <span className="exp-card__chip">{status}</span>}
        </div>
        <div className="exp-card__info-col">
          <p className="exp-card__name">{name}</p>
          <p className="exp-card__role">{role}</p>
        </div>
      </div>

      <div className="exp-card__expand">
        <div className="exp-card__expand-inner">
          <div className="exp-card__row">
            <div className="exp-card__label-col" aria-hidden />
            <div className="exp-card__paras">
              {paras.map((p, i) => (
                <p key={i} className="exp-card__para">{p}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <span className="exp-card__toggle" aria-hidden>{expanded ? '×' : '+'}</span>
    </button>
  )
}

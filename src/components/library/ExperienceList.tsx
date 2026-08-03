import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * ExperienceList — shelved, not dead.
 *
 * Was the Home page's left column until the 2026-08 layout rework moved the
 * bio and CTA there. Kept for reuse: the hover interaction (rows fade from a
 * staged opacity ramp to full, revealing the year column and a "See Full
 * Experience" CTA) is worth bringing back elsewhere.
 *
 * Styles live in globals.css under the "Experience" section (.exp-*).
 * Not currently rendered anywhere.
 */

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

export default ExperienceList

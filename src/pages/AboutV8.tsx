import { V8Footer, useV8Site } from '../components/v8/Chrome'
import { useV8Reveal } from '../hooks/useReveal'

// Content from the Figma About frame (3888:39007).

const BIO = [
  "I'm a multidisciplinary designer that's been working to help businesses scale and build brand and product systems since 2006.",
  "I've been extremely lucky to be able to work across all sorts of verticals in a close manner—often working directly with founders, directors, and CEOs.",
  "My philosophy for design has always the same no matter the medium or discipline—problem solving at its core with uncompromising craft. This is the way I've been able to adapt across all teams and shifts in the industry and contribute at a high level everywhere I've gone.",
]

const FACTS = [
  { label: 'Education', lines: ['Cal State Fullerton', 'BFA, Graphic Design'] },
  { label: 'Cats Adopted (2)', lines: ['Callie', 'Nanami AKA Nami'] },
]

const EXPERIENCE = [
  { company: 'Netflix', role: 'Staff Product Designer, NCXD', years: 'Current' },
  { company: 'A Parent Media Co. Inc.', role: 'VP, Design', years: '2025–2026' },
  { company: 'You.com', role: 'Senior Product Designer', years: '2024—2025' },
  { company: 'Mosaic Finance', role: 'Senior Product Designer', years: '2023—2024' },
  { company: 'Optro', role: 'Senior Product Designer', years: '2022—2023' },
  { company: 'Optro', role: 'Design Manager, Brand', years: '2020—2022' },
  { company: 'A Parent Media Co. Inc.', role: 'Director of Design', years: '2018—2020' },
  { company: 'Rooster Creatives', role: 'Senior Designer', years: '2017—2018' },
  { company: 'A Parent Media Co. Inc.', role: 'Founding Designer', years: '2012—2018' },
]

export default function AboutV8() {
  useV8Site()
  useV8Reveal()

  return (
    <div className="v8 v8-about">

      <section className="v8-about-intro">
        <h1 className="v8-display v8-about__title anim" style={{ animationDelay: '0.1s' }}>About</h1>
        <div className="v8-rule v8-about__rule" aria-hidden />
        <div className="v8-about__photo anim" style={{ animationDelay: '0.2s' }}>
          <img src="/v8/about-photo.jpg" alt="Eric Sin" />
        </div>
        <div className="v8-about__copy">
          <div className="v8-body v8-about__bio anim" style={{ animationDelay: '0.3s' }}>
            {BIO.map(p => <p key={p.slice(0, 24)}>{p}</p>)}
          </div>
          <dl className="v8-about__facts anim" style={{ animationDelay: '0.4s' }}>
            {FACTS.map(f => (
              <div key={f.label} className="v8-cs-fact">
                <dt className="v8-cs-fact__label">{f.label}</dt>
                <dd className="v8-cs-fact__value">
                  {f.lines.map((l, i) => <span key={l}>{i > 0 && <br />}{l}</span>)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="v8-section v8-about-exp">
        <p className="v8-label v8-label--flush">Experience</p>
        <div className="v8-row">
          <h2 className="v8-heading v8-about-exp__heading">
            20 Years of Experience<br />
            <span className="v8-muted v8-medium">2012—2026</span>
          </h2>
          <ul className="v8-about-exp__list">
            {EXPERIENCE.map(e => (
              <li key={`${e.company}-${e.years}`} className="v8-about-exp__row">
                <span className="v8-about-exp__company">{e.company}</span>
                <span className="v8-about-exp__role">{e.role}</span>
                <span className="v8-about-exp__years">{e.years}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <V8Footer />
    </div>
  )
}

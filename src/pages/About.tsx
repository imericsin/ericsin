import PageFooter from '../components/PageFooter'
import ExperienceCard from '../components/ExperienceCard'
import { delayAt } from '../lib/revealDelay'

const logoRows = [
  [
    { src: '/about/logos/nike.svg', alt: 'Nike' },
    { src: '/about/logos/nba.svg', alt: 'NBA' },
    { src: '/about/logos/mlb.svg', alt: 'MLB' },
    { src: '/about/logos/nhl.svg', alt: 'NHL' },
  ],
  [
    { src: '/about/logos/wnba.svg', alt: 'WNBA' },
    { src: '/about/logos/lego.svg', alt: 'Lego' },
    { src: '/about/logos/lime.svg', alt: 'Lime' },
  ],
]

const maxRowLength = Math.max(...logoRows.map(r => r.length))

const companies = [
  {
    logo: '/about/logos/apmc.jpg',
    name: 'A Parent Media Co. Inc.',
    role: 'VP, Design',
    status: 'Current',
    paras: [
      'A Parent Media Co. Inc. (APMC) is a streaming service reaching 50M+ monthly active users across CTV, mobile, and web, with brand partnerships spanning the WNBA, NHL, NFL, & NBA.',
      'At APMC I lead systems-level design across the platform, partnering with product and executive leadership on vision and roadmap strategy. I lead design for our major sports league partnerships, and coach a team of designers on data-informed practices.',
    ],
  },
  {
    logo: '/about/logos/you.jpg',
    name: 'You.com',
    role: 'Sr. Product Designer',
    status: null,
    paras: [
      'Building tools for human-AI collaboration, You.com was an AI search and answer engine that has recently pivoted into a growing B2B LLM-integration business.',
      'I designed frameworks that exposed model uncertainty to build user trust, and used rapid prototyping to de-risk product bets. I helped carve out a new B2B consulting offering, selling LLM integrations to partners like New Scientist, Nature.com, and WUBV.',
    ],
  },
  {
    logo: '/about/logos/mosaic.jpg',
    name: 'Mosaic Finance, LLC',
    role: 'Sr. Product Designer',
    status: null,
    paras: [
      'Mosaic builds FP&A SaaS for financial modeling, data management, and executive reporting.',
      'I led end-to-end design for the platform, translating complex financial data into clear, trustworthy experiences. Beyond execution, I partnered with product leadership on vision and roadmapping, applying systems thinking to define information architecture and taxonomies that made dense data understandable across user roles. I worked closely with engineering and data teams to design within real technical constraints.',
    ],
  },
  {
    logo: '/about/logos/optro.jpg',
    name: 'Optro',
    role: 'Sr. Product Designer / Design Manager, Brand',
    status: null,
    paras: [
      "Initially, I led AuditBoard's brand design team, driving design culture, craft consistency, and quality across digital product and event experiences.",
      'I pivoted to product design in 2022, leading 0-to-1 strategy for a third-party risk management platform, running JTBD research with enterprise customers to turn complex audit data into high-trust workflows—contributing to $1M ARR in year one, building 25+ direct customer/UXR partnerships, and drove cross-team efforts to close design-system gaps and contribute new patterns to the shared library.',
    ],
  },
  {
    logo: '/about/logos/apmc.jpg',
    name: 'A Parent Media Co. Inc.',
    role: 'Founding Designer',
    status: null,
    paras: [
      "As founding designer, I directed brand and product design across the portfolio, owning feature areas end-to-end. I was first designer on a 0-to-1 children's streaming platform, building brand and production-accurate design systems across mobile, web, and TV apps. I helped shape product strategy that scaled the business to nearly $10M in ARR by 2018.",
    ],
  },
  {
    logo: '/about/logos/apmc.jpg',
    name: 'A Parent Media Co. Inc.',
    role: 'Creative Director',
    status: null,
    paras: [],
  },
  {
    logo: '/about/logos/rooster.jpg',
    name: 'Rooster Creatives',
    role: 'Sr. Designer',
    status: null,
    paras: [
      'I got to work on well-known businesses local to the LA/OC area—defining brands for popular businesses like OMOMO, Jin Tea, Boiling Point, and more.',
      'While the work was less global, I still look back to this day at the things we made with fondness—ultimately helping to build for my community and up-leveling perception of good brand design for retail / brick-and-mortar businesses.',
    ],
  },
]

const interests = [
  { label: 'Gaming',      img: '/about/interests/gaming.png' },
  { label: 'Pets',        img: '/about/interests/pets.png' },
  { label: 'Photography', img: '/about/interests/photography.png' },
  { label: 'Design',      img: '/about/interests/design.png' },
]

export default function About() {
  return (
    <>
      {/* ── Mobile-only: full-bleed hero photo — sibling of .page, no padding context ── */}
      <div className="about-hero-mobile">
        <img src="/about/photo-mobile.jpg" alt="Eric Sin" className="about-hero-mobile__img" />
      </div>

    <div className="page page--about">

      {/* ── Mobile-only: bio text section ── */}
      <div className="about-bio-mobile">
        <h1 className="about-heading-mobile">About</h1>
        <div className="about-bio-mobile__body">
          <p>I'm a multidisciplinary designer that's been working to help businesses scale and build brand and product systems since 2006.</p>
          <p>I've been extremely lucky to be able to work across all sorts of verticals in a close manner—often working directly with founders, directors, and CEOs.</p>
          <p>My philosophy for design has always the same no matter the medium or discipline—problem solving at its core with uncompromising craft.</p>
          <p>This is the way I've been able to adapt across all teams and shifts in the industry and contribute at a high level everywhere I've gone.</p>
        </div>
      </div>

      {/* ── Section 1: About — desktop only, 10-column: label / image / spacer / content ── */}
      <section className="about-cols about-bio about-bio--desktop">
        <div className="about-col-label">
          <h1 className="about-heading anim" style={{ animationDelay: '0.05s' }}>About</h1>
        </div>
        <div className="about-col-scroll">
          <div className="about-photo-wrap anim" style={{ animationDelay: '0.2s' }}>
            <img src="/about/photo.jpg" alt="Eric Sin" className="about-photo" />
          </div>
        </div>
        <div aria-hidden />
        <div className="about-col-sticky">
          <div className="about-bio__body">
            <p className="about-bio__p anim" style={{ animationDelay: '0.1s' }}>I'm a multidisciplinary designer that's been working to help businesses scale and build brand and product systems since 2006.</p>
            <p className="about-bio__p anim" style={{ animationDelay: '0.15s' }}>I've been extremely lucky to be able to work across all sorts of verticals in a close manner—often working directly with founders, directors, and CEOs.</p>
            <p className="about-bio__p anim" style={{ animationDelay: '0.2s' }}>My philosophy for design has always the same no matter the medium or discipline—problem solving at its core with uncompromising craft.</p>
            <p className="about-bio__p anim" style={{ animationDelay: '0.25s' }}>This is the way I've been able to adapt across all teams and shifts in the industry and contribute at a high level everywhere I've gone.</p>
          </div>
        </div>
      </section>

      {/* ── Section 2: Experience — 10-column: label / logos / spacer / cards ── */}
      <section className="about-cols about-exp">
        <div className="about-col-label">
          <h2 className="about-section-heading anim" style={{ animationDelay: delayAt(0, 0) }}>Experience</h2>
        </div>
        <div className="about-col-scroll">
          <div className="about-exp__left-inner">
            <p className="about-section-sub anim" style={{ animationDelay: delayAt(1, 0) }}>I've worked as a key contributor in the roles listed, but have gotten to work with some other incredible brands as well.</p>
            <div className="about-logo-grid">
              {logoRows.map((row, i) => (
                <div key={i} className="about-logo-row">
                  {row.map(({ src, alt }, j) => (
                    <img
                      key={alt}
                      src={src}
                      alt={alt}
                      className="about-logo anim"
                      style={{ animationDelay: delayAt(2 + i, j) }}
                    />
                  ))}
                  {/* Pad short rows so every logo gets the same slot width */}
                  {Array.from({ length: maxRowLength - row.length }, (_, k) => (
                    <span key={`ghost-${k}`} className="about-logo about-logo--ghost" aria-hidden />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div aria-hidden />
        <div className="about-col-sticky about-exp__right">
          {companies.map((co, i) => (
            <div key={i} className="anim" style={{ animationDelay: delayAt(i, 1) }}>
              <ExperienceCard name={co.name} role={co.role} status={co.status} paras={co.paras} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: Interests — hidden for now ── */}
      {false && <section className="about-interests">
        <div className="about-interests__copy">
          <h2 className="about-section-heading">Interests</h2>
          <p className="about-section-sub">You can connect with me on any of these topics and I'll likely be unable to stop talking for hours. But it's always nice when you find someone who shares your interests, right?</p>
        </div>
        <div className="about-interests__grid">
          {interests.map(({ label, img }) => (
            <div key={label} className="about-interest-card">
              <div className="about-interest-img-wrap">
                <img src={img} alt={label} className="about-interest-img" />
              </div>
            </div>
          ))}
        </div>
      </section>}

    </div>
    <PageFooter />
    </>
  )
}

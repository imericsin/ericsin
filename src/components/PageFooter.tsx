interface Props {
  revealClass?: string
  servicesDelay?: string
  footerDelay?: string
  mobileOnly?: boolean
}

const SERVICES = [
  'Brand Design',
  'Brand Strategy',
  'Product & UX Strategy',
  'Frontend Development',
  'AI / LLM Consultation',
  'No-code Development',
  'UX/UI Design',
  'Digital Marketing',
]

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export default function PageFooter({
  revealClass,
  servicesDelay,
  footerDelay,
  mobileOnly,
}: Props) {
  const sectionClass = ['section-3col', revealClass ?? 'anim'].filter(Boolean).join(' ')
  const footerClass  = ['footer',       revealClass ?? 'anim'].filter(Boolean).join(' ')

  return (
    <>
      {!mobileOnly && (
        <>
          <section
            className={`${sectionClass} footer-desktop-section`}
            style={servicesDelay ? { animationDelay: servicesDelay } : undefined}
          >
            <div className="col"><p>Expertise &amp; Services</p></div>
            <div className="col col-services">
              {SERVICES.map(s => <p key={s}>{s}</p>)}
            </div>
            <div className="col col-contact">
              <p>Instagram / Threads / LinkedIn / YouTube</p>
              <a href="mailto:hello@ericsin.com">hello@ericsin.com</a>
            </div>
          </section>

          <footer
            className={`${footerClass} footer-desktop`}
            style={footerDelay ? { animationDelay: footerDelay } : undefined}
          >
            <div className="col"><p>©2018—2026</p></div>
            <div className="col col-mid"><p>Selected Works / Eric Sin</p></div>
            <div className="col right"><p>Made in Anaheim, California</p></div>
          </footer>
        </>
      )}

      <footer className="footer-mobile">
        <div className="footer-mobile__left">
          <p className="footer-mobile__copy">© 2026 Eric Sin</p>
          <p className="footer-mobile__sub">❤️ Made in California</p>
        </div>
        <button className="footer-mobile__top" onClick={scrollToTop} aria-label="Back to top">
          ↗ Back to Top
        </button>
      </footer>
    </>
  )
}

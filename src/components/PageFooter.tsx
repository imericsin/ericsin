interface Props {
  revealClass?: string   // 'reveal' for scroll-triggered, or 'anim' + delay for time-based
  servicesDelay?: string
  footerDelay?: string
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

export default function PageFooter({
  revealClass,
  servicesDelay,
  footerDelay,
}: Props) {
  const sectionClass = ['section-3col', revealClass ?? 'anim'].filter(Boolean).join(' ')
  const footerClass  = ['footer',       revealClass ?? 'anim'].filter(Boolean).join(' ')

  return (
    <>
      <section
        className={sectionClass}
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
        className={footerClass}
        style={footerDelay ? { animationDelay: footerDelay } : undefined}
      >
        <div className="col"><p>©2018—2026</p></div>
        <div className="col col-mid"><p>Selected Works / Eric Sin</p></div>
        <div className="col right"><p>Made in Anaheim, California</p></div>
      </footer>
    </>
  )
}

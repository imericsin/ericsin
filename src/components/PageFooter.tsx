interface Props {
  revealClass?: string
  className?: string
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Temporarily disabled site-wide — flip back to true to restore. Every
// call site (Home, About, Archives, WorkPage, WorksPage) is untouched.
const FOOTER_ENABLED = false

export default function PageFooter({ revealClass, className }: Props) {
  if (!FOOTER_ENABLED) return null

  return (
    <footer className={['footer-mobile', revealClass, className].filter(Boolean).join(' ')}>
      <div className="footer-mobile__left">
        <p className="footer-mobile__copy">© 2026 Eric Sin</p>
        <p className="footer-mobile__sub">❤️ Made in California</p>
      </div>
      <button className="footer-mobile__top" onClick={scrollToTop} aria-label="Back to top">
        ↗ Back to Top
      </button>
    </footer>
  )
}

interface Props {
  revealClass?: string
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export default function PageFooter({ revealClass }: Props) {
  return (
    <footer className={`footer-mobile${revealClass ? ` ${revealClass}` : ''}`}>
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

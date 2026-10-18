import { useEffect } from 'react'

function observeReveals() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        // Reveal on entry, but also if the element is already above the
        // viewport — a fast scroll can carry a newly mounted card past the
        // fold before it's ever observed, which would strand it at
        // opacity: 0 permanently.
        const scrolledPast = entry.boundingClientRect.bottom < 0
        if (entry.isIntersecting || scrolledPast) {
          entry.target.classList.add('in-view')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.1 }
  )

  document.querySelectorAll('.reveal:not(.in-view)').forEach(el => observer.observe(el))

  return () => observer.disconnect()
}

export function useReveal(deps: unknown[] = []) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(observeReveals, deps)
}

// Below-the-fold blocks on every v8 page: section labels and rows, case
// study blocks, and the footer rows. Anything already animating (.anim) or
// finished is left alone.
const V8_REVEAL = [
  '.v8-section > .v8-label',
  '.v8-section > .v8-row',
  '.v8-cs-reveal',
  '.v8-footer > .v8-row:not(.v8-footer__sign)',
  '.v8-footer__sign > *',
].join(', ')

/** Tags v8 page blocks for scroll-reveal, then observes every .reveal. */
export function useV8Reveal(deps: unknown[] = []) {
  useEffect(() => {
    document.querySelectorAll<HTMLElement>(V8_REVEAL).forEach(el => {
      const cl = el.classList
      if (!cl.contains('anim') && !cl.contains('anim-done') && !cl.contains('reveal-done')) cl.add('reveal')
    })
    return observeReveals()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

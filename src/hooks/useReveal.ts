import { useEffect } from 'react'

export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

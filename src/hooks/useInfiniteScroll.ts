import { useEffect, useRef, useState } from 'react'

/**
 * Reveals a list progressively as a sentinel element scrolls into view.
 *
 * The full list is already in memory — this only controls how much of it is
 * rendered, so there's no network work per page. Stops once everything is
 * shown rather than looping, so no card is ever repeated.
 *
 * Returns a ref to attach to a sentinel placed after the last item.
 */
export function useInfiniteScroll<T>(items: T[], initial: number, step: number) {
  const [count, setCount] = useState(initial)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Reset when the source list actually changes (e.g. it finished loading,
  // or a filter changed the set). Keyed on length rather than the array
  // reference itself — callers commonly rebuild `items` with a new array
  // identity every render (e.g. via .filter/.map in a parent), which would
  // otherwise reset the reveal count back to `initial` on every render and
  // permanently undo any progress the sentinel had made.
  useEffect(() => {
    setCount(initial)
  }, [items.length, initial])

  const hasMore = count < items.length

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasMore) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setCount(c => Math.min(c + step, items.length))
        }
      },
      // Start loading before the sentinel is actually on screen so the next
      // cards are in place by the time the user reaches them.
      { rootMargin: '600px 0px' }
    )

    observer.observe(node)

    // If the initial page is short enough that the sentinel is already
    // sitting on screen (or within rootMargin) at mount, the observer's
    // first callback never fires — IntersectionObserver only reports
    // *changes*, not the starting state, and there is no future scroll
    // event to change it. Check once, synchronously, so a short first page
    // (e.g. a narrow viewport, or few enough cards to fit without a
    // scrollbar) still reveals the rest instead of getting stuck.
    const rect = node.getBoundingClientRect()
    if (rect.top < window.innerHeight + 600) {
      setCount(c => Math.min(c + step, items.length))
    }

    return () => observer.disconnect()
  }, [hasMore, step, items.length])

  return { visible: items.slice(0, count), sentinelRef, hasMore }
}

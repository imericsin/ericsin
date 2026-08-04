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

  // Reset when the source list changes (e.g. it finished loading).
  useEffect(() => {
    setCount(initial)
  }, [items, initial])

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
    return () => observer.disconnect()
  }, [hasMore, step, items.length])

  return { visible: items.slice(0, count), sentinelRef, hasMore }
}

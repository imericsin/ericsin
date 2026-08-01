import { useEffect, useState } from 'react'

/**
 * Tracks how many grid columns are active at the current viewport width.
 *
 * `breakpoints` maps a max-width to a column count, narrowest first; `fallback`
 * applies above them all. Keep these in sync with the grid's CSS media queries —
 * the reveal cascade needs the real column count to compute row/col position.
 */
export function useColumns(
  breakpoints: Array<{ maxWidth: number; columns: number }>,
  fallback: number
): number {
  const resolve = () => {
    if (typeof window === 'undefined') return fallback
    for (const { maxWidth, columns } of breakpoints) {
      if (window.innerWidth <= maxWidth) return columns
    }
    return fallback
  }

  const [columns, setColumns] = useState(resolve)

  useEffect(() => {
    // No initial call — useState already resolved the current width. Calling it
    // here would re-render after Card's onAnimationEnd has mutated classNames
    // directly, resurrecting the stale class and killing the entry animation.
    const update = () => setColumns(resolve())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return columns
}

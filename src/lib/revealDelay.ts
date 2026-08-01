/**
 * Diagonal "rain" cascade — the Index page's timing, generalized.
 *
 * Index stages its cards with a 0.25s base offset and a 0.06s per-item step on
 * the `blurIn` animation. Reusing those exact numbers keeps every section on the
 * same rhythm.
 *
 * For multi-column grids the step is driven by the anti-diagonal (row + col) so
 * items fall from top-left toward bottom-right, as if gravity were pulling them
 * across the grid. Column is weighted lighter than row so the motion reads as
 * falling rather than sweeping sideways.
 */
export const BASE_DELAY = 0.25
export const STEP = 0.06
const COL_WEIGHT = 0.65

/**
 * Delay for an item at `index` in a grid `columns` wide.
 * Pass columns = 1 for a stacked list.
 */
export function diagonalDelay(index: number, columns: number, base = BASE_DELAY): string {
  const safeCols = Math.max(1, columns)
  return delayAt(Math.floor(index / safeCols), index % safeCols, base)
}

/** Same cascade when row and column are already known. */
export function delayAt(row: number, col: number, base = BASE_DELAY): string {
  return `${(base + (row + col * COL_WEIGHT) * STEP).toFixed(3)}s`
}

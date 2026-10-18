import { useEffect, type RefObject } from 'react'

// Picks black or white header text from whatever is actually behind it:
// an image or video pixel, else a background color, else the white page.
// Points across every header column are averaged into one tone for the
// whole nav — per-column tones read as broken over a single photo.
//
// The header gets data-tone="dark" (dark background → white text) or
// "light". Biased toward white over mid-tones, the usual call for text on
// photography (a 0.53-lightness hero reads better with white).

const GRID_W = 48                   // luminance grid width per image (px)
const DARK_BELOW = 0.65             // L* (0–1); the gap is hysteresis so the
const LIGHT_ABOVE = 0.75            // tone doesn't flicker on the boundary
const VIDEO_POLL = 700              // ms; video frames change without scrolling

type Grid = { w: number; h: number; data: Uint8ClampedArray }
const gridCache = new WeakMap<HTMLImageElement, Grid | null>()
const scratch = document.createElement('canvas')
const sctx = scratch.getContext('2d', { willReadFrequently: true })

function toGrid(src: CanvasImageSource, nw: number, nh: number): Grid | null {
  if (!sctx || !nw || !nh) return null
  const w = GRID_W, h = Math.max(1, Math.round((GRID_W * nh) / nw))
  scratch.width = w
  scratch.height = h
  try {
    sctx.clearRect(0, 0, w, h)
    sctx.drawImage(src, 0, 0, w, h)
    return { w, h, data: sctx.getImageData(0, 0, w, h).data }
  } catch {
    return null   // tainted (cross-origin) — fall through to other layers
  }
}

// Map a viewport point into the media's natural box, honouring object-fit
// and object-position, then read the grid there. null = transparent/outside.
function sampleMedia(el: HTMLImageElement | HTMLVideoElement, grid: Grid, nw: number, nh: number, x: number, y: number) {
  const r = el.getBoundingClientRect()
  const cs = getComputedStyle(el)
  const fit = cs.objectFit
  let sx = r.width / nw, sy = r.height / nh
  if (fit === 'cover') sx = sy = Math.max(sx, sy)
  else if (fit === 'contain' || fit === 'scale-down') sx = sy = Math.min(sx, sy)
  const [px, py] = cs.objectPosition.split(' ').map(v => (v.endsWith('%') ? parseFloat(v) / 100 : 0.5))
  const offX = (r.width - nw * sx) * (px ?? 0.5)
  const offY = (r.height - nh * sy) * (py ?? 0.5)
  const u = (x - r.left - offX) / (nw * sx)
  const v = (y - r.top - offY) / (nh * sy)
  if (u < 0 || u >= 1 || v < 0 || v >= 1) return null
  const i = (Math.floor(v * grid.h) * grid.w + Math.floor(u * grid.w)) * 4
  if (grid.data[i + 3] < 128) return null
  return luminance(grid.data[i], grid.data[i + 1], grid.data[i + 2])
}

function luminance(r: number, g: number, b: number) {
  const lin = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
  // Perceptual lightness (L*) of relative luminance, 0–1 — tracks how
  // light a color *looks*, which is what black-vs-white text depends on.
  const Y = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return (Y <= 0.008856 ? Y * 9.033 : 1.16 * Math.cbrt(Y) - 0.16)
}

function parseColor(c: string): [number, number, number, number] | null {
  const m = c.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const [r, g, b, a = '1'] = m[1].split(/[ ,/]+/).filter(Boolean)
  return [parseFloat(r), parseFloat(g), parseFloat(b), parseFloat(a)]
}

// Lightness of whatever is painted at (x, y) beneath the header.
function lightnessAt(x: number, y: number, header: HTMLElement): number {
  for (const el of document.elementsFromPoint(x, y)) {
    if (header.contains(el)) continue
    if (parseFloat(getComputedStyle(el).opacity) < 0.1) continue
    if (el instanceof HTMLImageElement && el.complete && el.naturalWidth) {
      let grid = gridCache.get(el)
      if (grid === undefined) { grid = toGrid(el, el.naturalWidth, el.naturalHeight); gridCache.set(el, grid) }
      const l = grid && sampleMedia(el, grid, el.naturalWidth, el.naturalHeight, x, y)
      if (l != null) return l
      continue
    }
    if (el instanceof HTMLVideoElement && el.readyState >= 2) {
      const grid = toGrid(el, el.videoWidth, el.videoHeight)
      const l = grid && sampleMedia(el, grid, el.videoWidth, el.videoHeight, x, y)
      if (l != null) return l
      continue
    }
    const bg = parseColor(getComputedStyle(el).backgroundColor)
    if (bg && bg[3] > 0.5) return luminance(bg[0], bg[1], bg[2])
  }
  return 1   // white page
}

export function useNavTone(headerRef: RefObject<HTMLElement | null>, page?: string) {
  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    let raf = 0

    function update() {
      raf = 0
      if (!header) return
      let sum = 0, n = 0
      for (const col of Array.from(header.children) as HTMLElement[]) {
        const r = col.getBoundingClientRect()
        if (!r.width) continue
        const y = r.top + r.height / 2
        for (const x of [r.left + 4, r.left + r.width / 2, r.right - 4]) {
          sum += lightnessAt(x, y, header)
          n++
        }
      }
      if (!n) return
      const l = sum / n
      const prev = header.dataset.tone
      const tone = l < DARK_BELOW ? 'dark' : l > LIGHT_ABOVE ? 'light' : (prev ?? 'light')
      if (tone !== prev) header.dataset.tone = tone
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update) }

    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    // Images finishing loading and video frames change what's underneath
    // without any scroll.
    document.addEventListener('load', schedule, true)
    const poll = window.setInterval(schedule, VIDEO_POLL)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      document.removeEventListener('load', schedule, true)
      clearInterval(poll)
    }
  }, [headerRef, page])
}

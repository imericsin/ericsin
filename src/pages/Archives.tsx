import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import PageFooter from '../components/PageFooter'

const LERP = 0.1 // 0=no movement, 1=instant — lower = more lag

function useMouseTrail(enabled: boolean) {
  const target = useRef({ x: -200, y: -200 })
  const current = useRef({ x: -200, y: -200 })
  const raf = useRef<number | null>(null)
  const elRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onMove(e: MouseEvent) {
      target.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    if (!enabled) {
      if (raf.current) { cancelAnimationFrame(raf.current); raf.current = null }
      return
    }

    function loop() {
      current.current.x += (target.current.x - current.current.x) * LERP
      current.current.y += (target.current.y - current.current.y) * LERP
      if (elRef.current) {
        elRef.current.style.transform = `translate(${current.current.x}px, ${current.current.y}px)`
      }
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [enabled])

  return elRef
}

interface ArchiveItem {
  filename: string
  date: string
}

const VIDEO_RE = /\.mp4$/i
function useNumCols() {
  const [n, setN] = useState(() => {
    if (window.innerWidth <= 640) return 2
    if (window.innerWidth <= 1024) return 3
    return 4
  })
  useEffect(() => {
    function update() {
      if (window.innerWidth <= 640) setN(2)
      else if (window.innerWidth <= 1024) setN(3)
      else setN(4)
    }
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return n
}

function isVideo(filename: string) {
  return VIDEO_RE.test(filename)
}

function ext(filename: string) {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}


// Distribute items into N columns in order (top to bottom, left to right)
function toColumns(items: ArchiveItem[], n: number): ArchiveItem[][] {
  const cols: ArchiveItem[][] = Array.from({ length: n }, () => [])
  items.forEach((item, i) => cols[i % n].push(item))
  return cols
}

interface ArchiveCardProps {
  item: ArchiveItem
  onClick: () => void
  onEnter: () => void
  onLeave: () => void
}

function ArchiveCard({ item, onClick, onEnter, onLeave }: ArchiveCardProps) {
  const src = `/archives/${item.filename}`
  const video = isVideo(item.filename)

  return (
    <div className="archive-card" onClick={onClick} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <div className="archive-card__asset">
        {video ? (
          <video src={src} muted playsInline preload="metadata" className="archive-card__media" />
        ) : (
          <img src={src} alt={item.filename} className="archive-card__media" loading="lazy" />
        )}
      </div>
      <div className="archive-card__meta">
        <span className="archive-card__name">{item.filename}</span>
        <span className="archive-card__year">{item.date}</span>
      </div>
    </div>
  )
}

interface OverlayProps {
  items: ArchiveItem[]
  index: number
  onClose: () => void
  onNav: (i: number) => void
}

function Overlay({ items, index, onClose, onNav }: OverlayProps) {
  const item = items[index]
  const src = `/archives/${item.filename}`
  const video = isVideo(item.filename)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && index > 0) onNav(index - 1)
      if (e.key === 'ArrowRight' && index < items.length - 1) onNav(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, items.length, onClose, onNav])

  return (
    <div className="archive-overlay" onClick={onClose}>
      {/* InfoController */}
      <div className="archive-overlay__info" onClick={e => e.stopPropagation()}>
        <div className="archive-overlay__meta">
          <span className="archive-overlay__meta-name">{item.filename}</span>
          <span className="archive-overlay__meta-year">{item.date}</span>
        </div>
        <button className="archive-overlay__close" onClick={onClose} aria-label="Close">
          <span className="archive-overlay__close-label">ESC TO CLOSE</span>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="8.5" y1="8.5" x2="19.5" y2="19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="19.5" y1="8.5" x2="8.5" y2="19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Artwork */}
      <div className="archive-overlay__content" onClick={e => e.stopPropagation()}>
        <div className="archive-overlay__artwork">
          {video ? (
            <video
              key={src}
              src={src}
              controls
              autoPlay
              muted
              playsInline
              className="archive-overlay__media"
            />
          ) : (
            <img
              key={src}
              src={src}
              alt={item.filename}
              className="archive-overlay__media"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function Archives() {
  const [items, setItems] = useState<ArchiveItem[]>([])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const numCols = useNumCols()
  const tooltipRef = useMouseTrail(tooltipVisible)

  useEffect(() => {
    fetch('/archives/manifest.json')
      .then(r => r.json())
      .then(setItems)
      .catch(() => setItems([]))
  }, [])

  const openOverlay = useCallback((i: number) => {
    setActiveIndex(i)
    requestAnimationFrame(() => requestAnimationFrame(() => setOverlayVisible(true)))
  }, [])

  const closeOverlay = useCallback(() => {
    setOverlayVisible(false)
    setTimeout(() => setActiveIndex(null), 350)
  }, [])

  const navOverlay = useCallback((i: number) => {
    setActiveIndex(i)
  }, [])

  const cols = toColumns(items, numCols)

  return (
    <>
      <div className="page archives-page">
        <div className="archives-header">
          <h1 className="archives-title">Archives</h1>
          <p className="archives-sub">More things I've made, just unorganized.</p>
        </div>

        <div className="archives-grid">
          {cols.map((col, ci) => (
            <div key={ci} className="archives-col">
              {col.map((item, ri) => {
                const globalIndex = ri * numCols + ci
                return (
                  <ArchiveCard
                    key={item.filename}
                    item={item}
                    onClick={() => openOverlay(globalIndex)}
                    onEnter={() => setTooltipVisible(true)}
                    onLeave={() => setTooltipVisible(false)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <PageFooter revealClass="anim" />

      {createPortal(
        <div
          ref={tooltipRef}
          className={`archive-tooltip${tooltipVisible ? ' archive-tooltip--visible' : ''}`}
          aria-hidden
        >
          View Details
        </div>,
        document.body
      )}

      {activeIndex !== null && createPortal(
        <div className={`archive-overlay-wrap${overlayVisible ? ' archive-overlay-wrap--visible' : ''}`}>
          <Overlay
            items={items}
            index={activeIndex}
            onClose={closeOverlay}
            onNav={navOverlay}
          />
        </div>,
        document.body
      )}
    </>
  )
}

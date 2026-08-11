import { useState } from 'react'
import NotificationToast, { type ToastItem } from './NotificationToast'

interface Props {
  items: ToastItem[]
  className?: string
}

// Up to 1 faux "stacked" card renders behind the active toast (peeking out
// above it) as static decoration. Cycling swaps the front card's content
// immediately and plays a simple slide+fade-in on it — no dual-card
// crossfade, just one card settling into place.
const MAX_STACK_PEEK = 1

export default function ToastFeed({ items, className }: Props) {
  const [index, setIndex] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const peekCount = Math.min(MAX_STACK_PEEK, Math.max(items.length - 1, 0))

  function go(nextIndex: number) {
    setIndex((nextIndex + items.length) % items.length)
    setAnimKey((k) => k + 1)
  }

  return (
    <div className={['toast-stack', className].filter(Boolean).join(' ')}>
      {Array.from({ length: peekCount }, (_, i) => (
        <div
          key={`${i}-${animKey}`}
          className="toast-stack__peek toast-stack__peek--enter"
          data-peek={i + 1}
          style={{ '--peek-i': i + 1 } as React.CSSProperties}
          aria-hidden
        />
      ))}
      <NotificationToast
        key={animKey}
        items={items}
        index={index}
        onIndexChange={go}
        className="toast-stack__front toast-stack__front--enter"
      />
    </div>
  )
}

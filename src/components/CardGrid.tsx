import { useState, type ReactNode, type CSSProperties } from 'react'

interface Props {
  className?: string
  children: ReactNode
}

export function useCardDim(count: number) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  function getDimStyle(index: number): CSSProperties {
    if (hoveredIndex === null) return {}
    return hoveredIndex === index
      ? { opacity: 1, transition: 'opacity 250ms ease-out' }
      : { opacity: 0.4, transition: 'opacity 250ms ease-out' }
  }

  return { hoveredIndex, setHoveredIndex, getDimStyle }
}

export default function CardGrid({ className, children }: Props) {
  return (
    <div className={['card-grid', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

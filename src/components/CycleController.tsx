import IconButton from './IconButton'

interface Props {
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
}

export default function CycleController({ onPrev, onNext, hasPrev, hasNext }: Props) {
  return (
    <div className="cycle-controller">
      <IconButton direction="left" onClick={onPrev} disabled={!hasPrev} aria-label="Previous" />
      <IconButton direction="right" onClick={onNext} disabled={!hasNext} aria-label="Next" />
    </div>
  )
}

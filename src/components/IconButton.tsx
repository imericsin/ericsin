import chevronDefault from '../assets/icons/chevron-default.svg'
import chevronHover from '../assets/icons/chevron-hover.svg'

interface Props {
  direction: 'left' | 'right'
  onClick: () => void
  disabled?: boolean
  'aria-label': string
}

// 20px hit target around a 16px glyph — a 2px pad on every side so the
// hover/tap area is bigger than the visible icon without changing its size.
// The exported glyph itself points left, so "right" is the one that flips.
export default function IconButton({ direction, onClick, disabled, 'aria-label': ariaLabel }: Props) {
  return (
    <button
      type="button"
      className="icon-btn"
      style={direction === 'right' ? { transform: 'scaleX(-1)' } : undefined}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      <img src={chevronDefault} className="icon-btn__glyph icon-btn__glyph--default" alt="" aria-hidden />
      <img src={chevronHover} className="icon-btn__glyph icon-btn__glyph--hover" alt="" aria-hidden />
    </button>
  )
}

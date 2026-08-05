interface Props {
  open: boolean
  onClick: () => void
  className?: string
}

export default function MenuIcon({ open, onClick, className }: Props) {
  return (
    <button
      type="button"
      className={`menu-icon${open ? ' menu-icon--open' : ''}${className ? ` ${className}` : ''}`}
      aria-label={open ? 'Close menu' : 'Open menu'}
      onClick={onClick}
    >
      <svg className="menu-icon__svg" width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <line className="menu-icon__line menu-icon__line--a" x1="7" y1="10.5" x2="21" y2="10.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        <line className="menu-icon__line menu-icon__line--b" x1="7" y1="17.5" x2="21" y2="17.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    </button>
  )
}

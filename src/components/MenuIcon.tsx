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
      <span className="menu-icon__line menu-icon__line--a" />
      <span className="menu-icon__line menu-icon__line--b" />
    </button>
  )
}

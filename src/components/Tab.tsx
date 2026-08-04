interface Props {
  label: string
  count?: number
  active: boolean
  onClick: () => void
  size?: 'desktop' | 'mobile'
}

export default function Tab({ label, count, active, onClick, size = 'desktop' }: Props) {
  return (
    <button
      type="button"
      className={`tab tab--${size}${active ? ' tab--active' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      <span className="tab__label">{label}</span>
      {size === 'desktop' && count !== undefined && (
        <span className="tab__count">{count}</span>
      )}
    </button>
  )
}

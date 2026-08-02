interface Props {
  /** Filter labels in display order, excluding the leading "All". */
  options: string[]
  /** Currently selected filter, or null for "All". */
  active: string | null
  onChange: (value: string | null) => void
  label?: string
  className?: string
  style?: React.CSSProperties
}

const ALL = 'All'

export default function FilterControls({
  options,
  active,
  onChange,
  label = 'Filter by Type',
  className,
  style,
}: Props) {
  const items = [ALL, ...options]

  return (
    <div className={['filter-controls', className].filter(Boolean).join(' ')} style={style}>
      {/* Label is visually hidden — kept as the group's accessible name. */}
      <div className="filter-controls__options" role="group" aria-label={label}>
        {items.map(item => {
          const selected = item === ALL ? active === null : active === item
          return (
            <button
              key={item}
              type="button"
              className={`filter-tab${selected ? ' filter-tab--selected' : ''}`}
              aria-pressed={selected}
              onClick={() => onChange(item === ALL ? null : item)}
            >
              {item}
            </button>
          )
        })}
      </div>
    </div>
  )
}

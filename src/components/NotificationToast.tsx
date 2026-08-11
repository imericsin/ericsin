import CycleController from './CycleController'

export interface ToastItem {
  assetSrc?: string
  assetAlt?: string
  /** Optional bold lead-in rendered inline before `copy`, e.g. "Aug. 11 Update". */
  title?: string
  copy: string
  label: string
  href?: string
}

interface Props {
  items: ToastItem[]
  index: number
  onIndexChange: (index: number) => void
  className?: string
}

export default function NotificationToast({ items, index, onIndexChange, className }: Props) {
  const item = items[index]
  if (!item) return null

  const hasPrev = items.length > 1
  const hasNext = items.length > 1

  const Wrapper = item.href ? 'a' : 'div'
  const wrapperProps = item.href
    ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
    : {}

  return (
    <div className={['toast', className].filter(Boolean).join(' ')}>
      <Wrapper className="toast__link" {...wrapperProps}>
        {item.assetSrc && (
          <div className="toast__asset">
            <img src={item.assetSrc} alt={item.assetAlt ?? ''} />
          </div>
        )}
        <div className="toast__body">
          <p className="toast__copy">
            {item.title && (
              <>
                <span className="toast__copy-title">{item.title}</span>
                <br />
              </>
            )}
            {item.copy}
          </p>
          <div className="toast__meta">
            <span className="toast__meta-text">{item.label}</span>
          </div>
        </div>
      </Wrapper>
      <div className="toast__cycle" onClick={(e) => e.stopPropagation()}>
        <CycleController
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPrev={() => hasPrev && onIndexChange(index - 1)}
          onNext={() => hasNext && onIndexChange(index + 1)}
        />
      </div>
    </div>
  )
}

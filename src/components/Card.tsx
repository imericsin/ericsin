import type { CSSProperties, AnimationEvent, MouseEventHandler } from 'react'
import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { CardTooltipContext } from '../App'

interface Props {
  title: string
  name?: string
  tags: string
  dateRange?: string
  thumb: string
  type?: 'image' | 'victory-orb'
  thumbType?: 'image' | 'video'
  variant?: 'work' | 'learn'
  href?: string
  slug?: string
  className?: string
  style?: CSSProperties
  onMouseEnter?: MouseEventHandler<HTMLAnchorElement>
  onMouseLeave?: MouseEventHandler<HTMLAnchorElement>
}

export default function Card({ title, name, tags, dateRange, thumb, type = 'image', thumbType = 'image', variant = 'work', href, slug, className, style, onMouseEnter, onMouseLeave }: Props) {
  const navigate = useNavigate()
  const { onEnter, onLeave } = useContext(CardTooltipContext)
  const thumbClass = `card-thumb thumb-${variant}`

  const mediaStyle = { position: 'absolute' as const, inset: 0, width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block' }

  const cardTags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []

  const chipOverlay = variant === 'work' && (cardTags.length > 0 || dateRange) ? (
    <div className="card-chip-row">
      <div className="card-chip-row__left">
        {cardTags.map(t => (
          <span key={t} className="card-chip">{t}</span>
        ))}
      </div>
      {dateRange && (
        <div className="card-chip-row__right">
          <span className="card-chip">{dateRange}</span>
        </div>
      )}
    </div>
  ) : null

  const inner = type === 'victory-orb' ? (
    <div className={`${thumbClass} victory-thumb`}>
      <div className="victory-orb-wrap">
        <div className="victory-orb-inner">
          <div className="victory-orb-fill" />
          <div className="victory-orb-border" />
          <img className="victory-logo" src={thumb} alt={title} />
        </div>
      </div>
      {chipOverlay}
    </div>
  ) : thumbType === 'video' ? (
    <div className={thumbClass}>
      <video
        src={thumb}
        poster={thumb.replace(/\.(mp4|webm|mov)$/i, '.jpg')}
        autoPlay muted loop playsInline style={mediaStyle}
      />
      {chipOverlay}
    </div>
  ) : (
    <div className={thumbClass}>
      <img src={thumb} alt={title} style={mediaStyle} loading="lazy" decoding="async" />
      {chipOverlay}
    </div>
  )

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!href) return
    if (e.metaKey || e.ctrlKey || e.shiftKey) return
    e.preventDefault()
    navigate(href)
  }

  function handleAnimationEnd(e: AnimationEvent<HTMLAnchorElement>) {
    if (e.animationName === 'blurIn') {
      e.currentTarget.classList.remove('anim')
      e.currentTarget.classList.add('anim-done')
    }
    if (e.animationName === 'riseIn') {
      e.currentTarget.classList.remove('reveal', 'in-view')
      e.currentTarget.classList.add('reveal-done')
    }
  }

  return (
    <a
      className={['card', className].filter(Boolean).join(' ')}
      style={style}
      href={href ?? '#'}
      onClick={handleClick}
      onAnimationEnd={handleAnimationEnd}
      onMouseEnter={e => { onEnter(); onMouseEnter?.(e) }}
      onMouseLeave={e => { onLeave(); onMouseLeave?.(e) }}
    >
      {inner}
      {variant === 'work' ? (
        <div className="card-meta">
          <div className="card-meta__top">
            <div className="card-meta__row1">
              {name && <p className="card-name">{name}</p>}
              {tags && <p className="card-categories card-categories--desktop">{tags}</p>}
            </div>
            <p className="card-title">{title}</p>
          </div>
        </div>
      ) : (
        <div className="card-caption">
          <p className="card-title">{title}</p>
          <p className="card-sub">{tags}</p>
        </div>
      )}
    </a>
  )
}

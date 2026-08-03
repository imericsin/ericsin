import type { CSSProperties } from 'react'
import type { AssetFile } from '../types/work'

interface Props {
  asset: AssetFile
  className?: string
  noClip?: boolean
  vtName?: string
}

export default function MediaAsset({ asset, className, noClip, vtName }: Props) {
  const vtStyle = vtName ? { viewTransitionName: vtName } as CSSProperties : undefined

  // noClip marks the full-bleed hero, which is above the fold — it loads
  // eagerly. Every other block sits below the fold, so defer it.
  const isHero = !!noClip

  const media = asset.kind === 'Video' ? (
    <video
      className={className}
      style={vtStyle}
      src={asset.src}
      poster={asset.fallback}
      autoPlay
      loop
      muted
      playsInline
      preload={isHero ? 'auto' : 'metadata'}
    />
  ) : (
    <img
      className={className}
      style={vtStyle}
      src={asset.src}
      alt=""
      loading={isHero ? 'eager' : 'lazy'}
      decoding="async"
      {...(isHero ? { fetchPriority: 'high' as const } : {})}
    />
  )

  if (noClip) return media
  return <div className="clip-reveal">{media}</div>
}

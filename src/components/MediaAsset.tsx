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
    />
  ) : (
    <img className={className} style={vtStyle} src={asset.src} alt="" />
  )

  if (noClip) return media
  return <div className="clip-reveal">{media}</div>
}

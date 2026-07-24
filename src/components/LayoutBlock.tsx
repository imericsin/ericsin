import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import MediaAsset from './MediaAsset'
import type { LayoutBlock as LayoutBlockType } from '../types/work'

interface Props {
  block: LayoutBlockType
  categories?: string
  heroVtName?: string
}

export default function LayoutBlock({ block, categories, heroVtName }: Props) {
  const { type, text, assets } = block

  switch (type) {
    case 'FULLHERO':
      return (
        <section className="block block-fullhero">
          {assets[0] && <MediaAsset asset={assets[0]} className="block-fullhero__media" noClip vtName={heroVtName} />}
        </section>
      )

    case 'FULL':
      return (
        <section className="block block-full">
          {assets[0] && <MediaAsset asset={assets[0]} className="block-full__media" />}
        </section>
      )

    case 'TEXT': {
      return (
        <section className="block block-text">
          <div className="block-text__inner">
            {text && <ReactMarkdown>{text}</ReactMarkdown>}
          </div>
        </section>
      )
    }

    case 'CREDITS': {
      const [creditsRaw = '', introRaw = ''] = (text ?? '').split(/\n---\n/)
      const typeList = categories?.split(',').map(c => c.trim()).filter(Boolean) ?? []
      return (
        <section className="block block-credits">
          <div className="block-credits__left">
            <ReactMarkdown remarkPlugins={[remarkBreaks]}>{creditsRaw.trim()}</ReactMarkdown>
            {typeList.length > 0 && (
              <div className="block-credits__type">
                <strong>Type</strong>
                {typeList.map(t => <p key={t}>{t}</p>)}
              </div>
            )}
          </div>
          <div className="block-credits__right">
            <ReactMarkdown>{introRaw.trim()}</ReactMarkdown>
          </div>
        </section>
      )
    }

    case '2COL': {
      const lines = (text ?? '').trim().split('\n')
      const label = lines[0] ?? ''
      const body = lines.slice(1).join('\n').trim()
      const hasText = !!(label || body)

      if (!hasText && assets.length >= 2) {
        return (
          <section className="block block-2col-images">
            {assets.map(asset => (
              <MediaAsset key={asset.src} asset={asset} className="block-2col-images__asset" />
            ))}
          </section>
        )
      }

      return (
        <section className="block block-2col">
          <div className="block-2col__text">
            {label && <p className="block-2col__label">{label}</p>}
            {body && <ReactMarkdown>{body}</ReactMarkdown>}
          </div>
          <div className="block-2col__media">
            {assets.map(asset => (
              <MediaAsset key={asset.src} asset={asset} className="block-2col__asset" />
            ))}
          </div>
        </section>
      )
    }

    case '3COL': {
      const lines = (text ?? '').trim().split('\n')
      const label = lines[0] ?? ''
      const body = lines.slice(1).join('\n').trim()
      return (
        <section className="block block-3col">
          <div className="block-3col__text">
            {label && <p className="block-3col__label">{label}</p>}
            {body && <p className="block-3col__body">{body}</p>}
          </div>
          <div className="block-3col__media">
            {assets.map(asset => (
              <MediaAsset key={asset.src} asset={asset} className="block-3col__asset" />
            ))}
          </div>
        </section>
      )
    }

    default:
      return null
  }
}

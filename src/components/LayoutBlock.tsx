import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import { BeforeAfter } from 'react-simple-before-after'
import MediaAsset from './MediaAsset'
import type { LayoutBlock as LayoutBlockType } from '../types/work'

interface Props {
  block: LayoutBlockType
  categories?: string
  heroVtName?: string
  meta?: import('../types/work').WorkMeta
}

// Parses block text: lines starting with "## " become the subhead; remaining lines are body
function parseBlockText(text: string | undefined) {
  const lines = (text ?? '').trim().split('\n')
  let subhead = ''
  const bodyLines: string[] = []
  for (const line of lines) {
    if (!subhead && line.startsWith('## ')) {
      subhead = line.replace(/^##\s+/, '')
    } else {
      bodyLines.push(line)
    }
  }
  const body = bodyLines.join('\n').trim()
  return { subhead, body }
}

export default function LayoutBlock({ block, categories, heroVtName, meta }: Props) {
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

    case 'OVERVIEW': {
      const [, introRaw = ''] = (text ?? '').split(/\n?---\n/)

      const scopeLines = meta?.categories ? meta.categories.split(',').map(s => s.trim()).filter(Boolean) : []
      const metaRows = [
        meta?.role   ? { label: 'Role',     lines: meta.role.split('\n').filter(Boolean) }   : null,
        scopeLines.length ? { label: 'Scope', lines: scopeLines } : null,
        meta?.industry ? { label: 'Industry', lines: meta.industry.split('\n').filter(Boolean) } : null,
      ].filter(Boolean) as { label: string; lines: string[] }[]

      const hasLinks = !!(meta?.links?.length)

      const overviewCol = (
        <div className="block-credits__overview">
          <div className="block-credits__overview-body">
            <ReactMarkdown>{introRaw.trim()}</ReactMarkdown>
          </div>
        </div>
      )

      const renderLinkCard = (link: { label: string; url: string; date?: string }, mobile = false) => (
        <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
          className={mobile ? 'link-card link-card--mobile' : 'link-card'}>
          <div className="link-card__label">
            {link.date && <p className="link-card__date">{link.date}</p>}
            <p className="link-card__title">{link.label}</p>
          </div>
          <p className="link-card__cta">Read Article ↗</p>
        </a>
      )

      const linkStack = hasLinks ? (
        <div className="link-card-stack">
          {meta!.links!.map(l => renderLinkCard(l))}
        </div>
      ) : null

      const mobileLinkStack = hasLinks ? (
        <div className="link-card-stack">
          {meta!.links!.map(l => renderLinkCard(l, true))}
        </div>
      ) : null

      // Mobile splits meta into left col (Role+Scope) and right col (Industry)
      const mobileMetaLeft = metaRows.filter(r => r.label === 'Role' || r.label === 'Scope')
      const mobileMetaRight = metaRows.filter(r => r.label === 'Industry')

      const renderMetaGroup = (rows: typeof metaRows) => rows.map(row => (
        <div key={row.label} className="block-credits__meta-row">
          <p className="block-credits__meta-label">{row.label}</p>
          <div className="block-credits__meta-values">
            {row.lines.map(l => <p key={l}>{l}</p>)}
          </div>
        </div>
      ))

      return (
        <section className="block block-credits">
          {/* Desktop: left meta col, center overview, spacer, right link card */}
          <div className="block-credits__meta">{renderMetaGroup(metaRows)}</div>
          <div className="block-credits__spacer" />
          <div className="block-credits__center">{overviewCol}</div>
          <div className="block-credits__spacer-right" />
          <div className="block-credits__link-desktop">{linkStack}</div>

          {/* Mobile: overview first, then 2-col meta row, then link stack */}
          <div className="block-credits__mobile-overview">{overviewCol}</div>
          <div className="block-credits__mobile-meta">
            <div className="block-credits__mobile-col">{renderMetaGroup(mobileMetaLeft)}</div>
            <div className="block-credits__mobile-col">{renderMetaGroup(mobileMetaRight)}</div>
          </div>
          {hasLinks && mobileLinkStack}
        </section>
      )
    }

    case '2COL': {
      const { subhead, body } = parseBlockText(text)
      const hasText = !!(subhead || body)

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
            {subhead && <p className="block-2col__label">{subhead}</p>}
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
      const { subhead, body } = parseBlockText(text)
      return (
        <section className="block block-3col">
          <div className="block-3col__text">
            {subhead && <p className="block-3col__label">{subhead}</p>}
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

    case 'COMP': {
      const { subhead, body } = parseBlockText(text)
      const hasText = !!(subhead || body)

      const before = assets.find(a => a.slot === '1' || a.slot === '01')
      const after = assets.find(a => a.slot === '2' || a.slot === '02')

      if (!before || !after) return null

      return (
        <section className="block block-comp">
          {hasText && (
            <div className="block-comp__text">
              {subhead && <p className="block-2col__label">{subhead}</p>}
              {body && <p>{body}</p>}
            </div>
          )}
          <div className="block-comp__media">
            <BeforeAfter
              beforeImage={before.src}
              afterImage={after.src}
              style={{ width: '100%', borderRadius: 'var(--radius-card)' }}
              buttonStyle={{ background: 'var(--system-background-1)', border: '1px solid var(--component-border-1)', width: 36, height: 36, borderRadius: '50%' }}
              buttonClassName="block-comp__handle"
            />
            <span className="card-tag block-comp__tag block-comp__tag--before">Before</span>
            <span className="card-tag block-comp__tag block-comp__tag--after">After</span>
          </div>
        </section>
      )
    }

    default:
      return null
  }
}

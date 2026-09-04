import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import { BeforeAfter } from 'react-simple-before-after'
import MediaAsset from './MediaAsset'
import type { LayoutBlock as LayoutBlockType } from '../types/work'

interface Props {
  block: LayoutBlockType
  heroVtName?: string
  meta?: import('../types/work').WorkMeta
}

// Inline links inside case study copy. Separate from the Experience list's
// .link-dotted so the two can diverge. Applied via ReactMarkdown's component
// map so every block picks it up without per-call-site markup.
const MD_COMPONENTS = {
  a: ({ href, children, ...props }: React.ComponentPropsWithoutRef<'a'>) => (
    <a
      {...props}
      href={href}
      className="csblock-link"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
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

export default function LayoutBlock({ block, heroVtName, meta }: Props) {
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
      const { subhead, body } = parseBlockText(text)
      return (
        <section className="block block-text">
          {subhead && <p className="block-text__label">{subhead}</p>}
          <div className="block-text__spacer" aria-hidden />
          <div className="block-text__inner">
            {body && <ReactMarkdown components={MD_COMPONENTS}>{body}</ReactMarkdown>}
          </div>
          <div className="block-text__spacer" aria-hidden />
        </section>
      )
    }

    case 'OVERVIEW': {
      // Body content follows a leading "---" and an optional "## Heading"
      // (kept in layout.md for authoring structure, but the new design has
      // no visible label here — only the paragraphs after it render).
      const [, introRaw = ''] = (text ?? '').split(/\n?---\n/)
      const introBody = introRaw.trim().replace(/^##[^\n]*\n+/, '').trim()

      // Desktop shows Role/Scope/Type/Industry in the sticky left rail
      // (see WorkPage.tsx's railMetaRows) — there's no rail at single
      // column, so this same data reappears here instead, below the intro
      // copy, as a 2-col grid under a divider. CSS-only visibility (see
      // .block-overview__meta in v65.css): this markup always renders,
      // the desktop breakpoint just hides it since the rail already shows
      // the same fields.
      const workScopeLines = meta?.workScope ? meta.workScope.split(',').map(s => s.trim()).filter(Boolean) : []
      const metaCols: { label: string; lines: string[] }[][] = [
        [
          meta?.role ? { label: 'Role', lines: meta.role.split('\n').filter(Boolean) } : null,
          meta?.type ? { label: 'Type', lines: [meta.type] } : null,
        ].filter(Boolean) as { label: string; lines: string[] }[],
        [
          workScopeLines.length ? { label: 'Scope', lines: workScopeLines } : null,
          meta?.industry ? { label: 'Industry', lines: meta.industry.split('\n').filter(Boolean) } : null,
        ].filter(Boolean) as { label: string; lines: string[] }[],
      ]
      const hasMeta = metaCols.some(col => col.length > 0)

      return (
        <section className="block block-overview">
          <p className="block-overview__headline">{meta?.headliner}</p>
          <div className="block-overview__spacer" aria-hidden />
          <div className="block-overview__body">
            <ReactMarkdown components={MD_COMPONENTS}>{introBody}</ReactMarkdown>
          </div>
          <div className="block-overview__spacer" aria-hidden />
          {hasMeta && (
            <div className="block-overview__meta">
              {metaCols.map((col, i) => (
                <div key={i} className="block-overview__meta-col">
                  {col.map(row => (
                    <div key={row.label} className="block-overview__meta-row">
                      <p className="block-overview__meta-label">{row.label}</p>
                      {row.lines.map(l => <p key={l} className="block-overview__meta-value">{l}</p>)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
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
            {body && <ReactMarkdown components={MD_COMPONENTS}>{body}</ReactMarkdown>}
          </div>
          <div className="block-2col__media">
            {assets.map(asset => (
              <MediaAsset key={asset.src} asset={asset} className="block-2col__asset" />
            ))}
          </div>
        </section>
      )
    }

    case '2COLTEXT': {
      const { subhead, body } = parseBlockText(text)
      // Slot 01 is the large left-column image; slot 02 is the smaller
      // image stacked above the text in the right column (resolveAssets
      // in parseLayout.ts already sorts assets by slot).
      const [primary, secondary] = assets
      return (
        <section className="block block-2coltext">
          {primary && <MediaAsset asset={primary} className="block-2coltext__primary" />}
          <div className="block-2coltext__aside">
            {secondary && <MediaAsset asset={secondary} className="block-2coltext__secondary" />}
            <div className="block-2coltext__text">
              {subhead && <p className="block-2coltext__label">{subhead}</p>}
              {body && (
                <div className="block-2coltext__body">
                  <ReactMarkdown components={MD_COMPONENTS}>{body}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </section>
      )
    }

    case 'COMP': {
      const caption = (text ?? '').trim()

      const before = assets.find(a => a.slot === '1' || a.slot === '01')
      const after = assets.find(a => a.slot === '2' || a.slot === '02')

      if (!before || !after) return null

      return (
        <section className="block block-comp">
          <div className="block-comp__media">
            <BeforeAfter
              beforeImage={before.src}
              afterImage={after.src}
              style={{ width: '100%' }}
              buttonStyle={{ background: 'var(--system-background-1)', border: '1px solid var(--component-border-1)', width: 36, height: 36, borderRadius: '50%' }}
              buttonClassName="block-comp__handle"
            />
            <span className="card-tag block-comp__tag block-comp__tag--before">Before</span>
            <span className="card-tag block-comp__tag block-comp__tag--after">After</span>
          </div>
          {caption && (
            <div className="block-comp__caption">
              <ReactMarkdown components={MD_COMPONENTS}>{caption}</ReactMarkdown>
            </div>
          )}
        </section>
      )
    }

    default:
      return null
  }
}

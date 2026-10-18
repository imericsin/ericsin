import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { BeforeAfter } from 'react-simple-before-after'
import MediaAsset from '../components/MediaAsset'
import { MD_COMPONENTS, parseBlockText } from '../components/LayoutBlock'
import { V8Footer, useV8Site } from '../components/v8/Chrome'
import { parseLayout, resolveAssets } from '../lib/parseLayout'
import { useV8Reveal } from '../hooks/useReveal'
import type { WorkMeta, LayoutBlock } from '../types/work'

interface Props {
  onTheme?: (theme: Record<string, string> | null) => void
  onTitle?: (title: string | null) => void
}

// A case study reads as the home page does: numbered sections separated by
// full-bleed dashed rules. OVERVIEW and TEXT blocks open a new section
// (label + heading/body row); every media block that follows flows into
// that section until the next one opens.
interface Section {
  key: string
  numbered?: boolean   // false for media that precedes any text section
  label?: string       // replaces the "/NN." label (Overview has no number)
  heading?: string
  body?: string
  facts?: { label: string; lines: string[] }[]
  media: LayoutBlock[]
}

function overviewBody(text: string | undefined) {
  // Same shape LayoutBlock's OVERVIEW reads: body follows a leading "---"
  // and an optional "## Heading" that isn't displayed.
  const [, raw = ''] = (text ?? '').split(/\n?---\n/)
  return raw.trim().replace(/^##[^\n]*\n+/, '').trim()
}

const lines = (s?: string) => (s ?? '').split('\n').map(l => l.trim()).filter(Boolean)

function overviewFacts(meta: WorkMeta) {
  return [
    { label: 'Role', lines: lines(meta.role) },
    { label: 'Scope', lines: meta.scope ? lines(meta.scope) : (meta.workScope ?? '').split(',').map(s => s.trim()).filter(Boolean) },
  ].filter(f => f.lines.length > 0)
}

// Inset layout: the facts row under the title, one per header column.
function titleFacts(meta: WorkMeta) {
  return [
    ...overviewFacts(meta),
    { label: 'Industry', lines: lines(meta.industry) },
    { label: 'Type', lines: meta.type ? [meta.type] : [] },
  ].filter(f => f.lines.length > 0)
}
const FACT_COLS = ['v8-col-name', 'v8-col-bio', 'v8-col-nav', 'v8-col-contact']

function buildSections(blocks: LayoutBlock[], meta: WorkMeta, withOverviewFacts: boolean): Section[] {
  const sections: Section[] = []
  for (const block of blocks) {
    if (block.type === 'FULLHERO') continue
    if (block.type === 'OVERVIEW') {
      sections.push({ key: block.order, numbered: true, label: 'Overview', heading: meta.headliner, body: overviewBody(block.text), facts: withOverviewFacts ? overviewFacts(meta) : undefined, media: [] })
      continue
    }
    if (block.type === 'TEXT') {
      const { subhead, body } = parseBlockText(block.text)
      sections.push({ key: block.order, numbered: true, heading: subhead || undefined, body, media: [] })
      continue
    }
    if (!sections.length) sections.push({ key: `pre-${block.order}`, media: [] })
    sections[sections.length - 1].media.push(block)
  }
  return sections
}

const pad = (n: number) => String(n).padStart(2, '0')

function MediaBlock({ block }: { block: LayoutBlock }) {
  const { type, assets } = block

  if (type === 'FULL') {
    return assets[0] ? <div className="v8-cs-media v8-cs-full"><MediaAsset asset={assets[0]} /></div> : null
  }

  if (type === '2COL') {
    const { subhead, body } = parseBlockText(block.text)
    if (!subhead && !body) {
      return (
        <div className="v8-cs-media v8-cs-pair">
          {assets.map(a => <MediaAsset key={a.src} asset={a} />)}
        </div>
      )
    }
    return (
      <div className="v8-cs-media v8-row v8-cs-split">
        <div className="v8-cs-split__text v8-body">
          {subhead && <p className="v8-cs-subhead">{subhead}</p>}
          {body && <ReactMarkdown components={MD_COMPONENTS}>{body}</ReactMarkdown>}
        </div>
        <div className="v8-cs-split__media">
          {assets.map(a => <MediaAsset key={a.src} asset={a} />)}
        </div>
      </div>
    )
  }

  if (type === '2COLTEXT') {
    const { subhead, body } = parseBlockText(block.text)
    const [primary, secondary] = assets
    return (
      <div className="v8-cs-media v8-row v8-cs-feature">
        <div className="v8-cs-feature__primary">{primary && <MediaAsset asset={primary} />}</div>
        <div className="v8-cs-feature__aside">
          {secondary && <MediaAsset asset={secondary} />}
          <div className="v8-body">
            {subhead && <p className="v8-cs-subhead">{subhead}</p>}
            {body && <ReactMarkdown components={MD_COMPONENTS}>{body}</ReactMarkdown>}
          </div>
        </div>
      </div>
    )
  }

  if (type === 'COMP') {
    const before = assets.find(a => a.slot === '01')
    const after = assets.find(a => a.slot === '02')
    if (!before || !after) return null
    const caption = (block.text ?? '').trim()
    return (
      <figure className="v8-cs-media v8-cs-comp">
        <div className="v8-cs-comp__frame">
          <BeforeAfter
            beforeImage={before.src}
            afterImage={after.src}
            style={{ width: '100%' }}
            buttonStyle={{ background: '#fff', border: '1px solid var(--v8-rule)', width: 36, height: 36, borderRadius: '50%' }}
          />
          <span className="v8-mono v8-cs-comp__tag v8-cs-comp__tag--before">Before</span>
          <span className="v8-mono v8-cs-comp__tag v8-cs-comp__tag--after">After</span>
        </div>
        {caption && (
          <figcaption className="v8-mono v8-cs-caption">
            <ReactMarkdown components={MD_COMPONENTS}>{caption}</ReactMarkdown>
          </figcaption>
        )}
      </figure>
    )
  }

  return null
}

export default function WorkPageV8({ onTheme, onTitle }: Props) {
  useV8Site()
  const { slug } = useParams<{ slug: string }>()
  const [meta, setMeta] = useState<WorkMeta | null>(null)
  const [blocks, setBlocks] = useState<LayoutBlock[]>([])
  const [error, setError] = useState(false)
  // Hero layout under trial. Default is the inset hero under a title block;
  // ?hero=bleed shows the full-bleed hero behind the header for comparison.
  const [searchParams] = useSearchParams()
  const bleed = searchParams.get('hero') === 'bleed'

  useEffect(() => {
    if (!slug) return
    setMeta(null)
    setBlocks([])
    setError(false)
    Promise.all([
      fetch(`/work/${slug}/layout.md`),
      fetch(`/work/${slug}/assets.json`),
    ]).then(async ([layoutRes, assetsRes]) => {
      if (!layoutRes.ok) { setError(true); return }
      const raw = await layoutRes.text()
      const filenames: string[] = assetsRes.ok ? await assetsRes.json() : []
      const { meta, blocks } = parseLayout(raw, slug)
      setMeta(meta)
      setBlocks(resolveAssets(filenames, slug, blocks))
    }).catch(() => setError(true))
  }, [slug])

  useEffect(() => {
    onTheme?.(meta?.theme ?? null)
    onTitle?.(meta?.title ?? null)
  }, [meta])

  const sections = useMemo(() => (meta ? buildSections(blocks, meta, bleed) : []), [blocks, meta, bleed])

  // Text rows, media blocks, section labels and the footer blur in on scroll.
  useV8Reveal([sections])

  if (error) {
    return (
      <div className="v8 v8-cs">
        <section className="v8-section v8-cs-section">
          <div className="v8-row">
            <h1 className="v8-heading v8-col-heading">Case study not found.</h1>
            <div className="v8-col-body v8-body"><p><Link to="/">Back to work</Link></p></div>
          </div>
        </section>
        <V8Footer />
      </div>
    )
  }
  if (!meta) return null

  const hero = blocks.find(b => b.type === 'FULLHERO')?.assets[0]
  let n = 0

  return (
    <div className="v8 v8-cs">

      {bleed ? (
        <>
          <h1 className="v8-sr-only">{meta.title}</h1>
          {hero && (
            <div className="v8-cs-hero anim" style={{ animationDelay: '0.1s' }}>
              <MediaAsset asset={hero} noClip />
            </div>
          )}
        </>
      ) : (
        <section className="v8-cs-top">
          <h1 className="v8-display v8-cs-top__title anim" style={{ animationDelay: '0.1s' }}>{meta.title}</h1>
          <div className="v8-rule" aria-hidden />
          <dl className="v8-row v8-cs-top__facts anim" style={{ animationDelay: '0.2s' }}>
            {titleFacts(meta).map((f, i) => (
              <div key={f.label} className={`v8-cs-fact ${FACT_COLS[i]}`}>
                <dt className="v8-cs-fact__label">{f.label}</dt>
                <dd className="v8-cs-fact__value">
                  {f.lines.map((l, j) => <span key={l}>{j > 0 && <br />}{l}</span>)}
                </dd>
              </div>
            ))}
          </dl>
          {hero && (
            <div className="v8-cs-top__hero anim" style={{ animationDelay: '0.3s' }}>
              <MediaAsset asset={hero} noClip />
            </div>
          )}
        </section>
      )}

      {sections.map(section => {
        const num = section.numbered ? ++n : 0
        const label = section.label ?? (num ? `/${pad(num)}.` : null)
        const hasCopy = !!(section.heading || section.body)
        return (
          <section key={section.key} className={`v8-section v8-cs-section${label ? '' : ' v8-cs-section--bare'}`}>
            {label && <p className="v8-label">{label}</p>}
            {hasCopy && (
              <div className="v8-row v8-cs-reveal">
                <div className="v8-col-heading v8-cs-intro">
                  {section.heading && <h2 className="v8-heading">{section.heading}</h2>}
                  {section.facts && section.facts.length > 0 && (
                    <dl className="v8-cs-facts">
                      {section.facts.map(f => (
                        <div key={f.label} className="v8-cs-fact">
                          <dt className="v8-cs-fact__label">{f.label}</dt>
                          <dd className="v8-cs-fact__value">
                            {f.lines.map((l, i) => <span key={l}>{i > 0 && <br />}{l}</span>)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
                {section.body && (
                  <div className={`v8-col-body v8-body${section.facts ? ' v8-cs-body--overview' : ''}`}>
                    <ReactMarkdown components={MD_COMPONENTS}>{section.body}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
            {section.media.length > 0 && (
              <div className="v8-cs-stack">
                {section.media.map(block => (
                  <div key={`${block.order}_${block.type}`} className="v8-cs-reveal">
                    <MediaBlock block={block} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      })}

      <V8Footer />
    </div>
  )
}

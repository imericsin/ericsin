import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import LayoutBlockComponent from '../components/LayoutBlock'
import PageFooter from '../components/PageFooter'
import { parseLayout, resolveAssets } from '../lib/parseLayout'
import type { WorkMeta, LayoutBlock } from '../types/work'

interface Props {
  onTheme?: (theme: Record<string, string> | null) => void
  // v6.5's nav shows "Work / {title}" in place of the site identity while
  // on a case study — set once meta loads, cleared by App.tsx on route
  // change so the previous title never flashes on the next page.
  onTitle?: (title: string | null) => void
}

export default function WorkPage({ onTheme, onTitle }: Props) {
  const { slug } = useParams<{ slug: string }>()
  const [meta, setMeta] = useState<WorkMeta | null>(null)
  const [blocks, setBlocks] = useState<LayoutBlock[]>([])
  const [error, setError] = useState(false)

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

  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const children = Array.from(el.children) as HTMLElement[]
    children.forEach(child => child.classList.add('reveal'))
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); observer.unobserve(e.target) } }),
      { threshold: 0.08, rootMargin: '-80px 0px' }
    )
    children.forEach(child => observer.observe(child))
    return () => observer.disconnect()
  }, [blocks])

  if (error) return <div className="page"><p>Case study not found.</p></div>
  if (!meta) return null

  const heroBlock = blocks.find(b => b.type === 'FULLHERO')
  const contentBlocks = blocks.filter(b => b.type !== 'FULLHERO')

  // v6.5 moves Role/Scope/Industry out of the inline OVERVIEW block and into
  // the sticky left rail. Derived independently here (same fields
  // LayoutBlock's OVERVIEW case already reads from `meta`) rather than
  // changing LayoutBlock itself — that component's block-type contract is
  // explicitly out of scope for the reskin. On main/pre-reskin, the rail
  // markup below is simply unused (LayoutBlock still renders its own inline
  // meta unchanged); v65.css hides the inline copy so it isn't duplicated.
  const scopeLines = meta.workScope ? meta.workScope.split(',').map(s => s.trim()).filter(Boolean) : []
  const railMetaRows = [
    meta.role ? { label: 'Role', lines: meta.role.split('\n').filter(Boolean) } : null,
    scopeLines.length ? { label: 'Scope', lines: scopeLines } : null,
    meta.industry ? { label: 'Industry', lines: meta.industry.split('\n').filter(Boolean) } : null,
  ].filter(Boolean) as { label: string; lines: string[] }[]

  return (
    <>
      <div className="page page--work work-layout">
        {/* Single-column-only: a second copy of the hero, sibling to
            .page-content itself (not nested inside .page-content__main
            like the desktop copy below) so it can bleed full-bleed to the
            page's own edges — .page-content carries the horizontal inset
            at this breakpoint instead of .page, so anything outside it
            escapes that padding entirely. CSS toggles which of the two
            copies is visible per breakpoint; both always render. */}
        {heroBlock && (
          <div className="work-hero work-hero--mobile">
            <LayoutBlockComponent block={heroBlock} />
          </div>
        )}
        <div className="page-content style-sidebar">
          <div className="work-left page-content__sidebar">
            <div className="work-left__top">
              <div className="work-rail-meta anim" style={{ animationDelay: '0.1s' }}>
                {railMetaRows.map(row => (
                  <div key={row.label} className="work-rail-meta__row">
                    <p className="work-rail-meta__label">{row.label}</p>
                    {row.lines.map(l => <p key={l} className="work-rail-meta__value">{l}</p>)}
                  </div>
                ))}
              </div>
            </div>
            {/* Reserved for future rail-bottom controls (mirrors the old
                ToastFeed slot in .home-left) — intentionally empty for now. */}
          </div>

          <div className="work-right page-content__main">
            <section className="work-header">
              <div className="work-breadcrumb anim" style={{ animationDelay: '0.1s' }}>
                <Link to="/" className="work-breadcrumb__link">Work</Link>
                <span className="work-breadcrumb__sep">/</span>
                <span>{meta.title}</span>
              </div>
              {/* Pre-reskin position — v65.css hides this and shows the
                  in-content copy below instead; unscoped builds keep this
                  exactly where it's always been. */}
              <h1 className="work-headliner anim" style={{ animationDelay: '0.2s' }}>{meta.headliner}</h1>
            </section>

            {heroBlock && (
              <div className="work-hero work-hero--desktop">
                <LayoutBlockComponent block={heroBlock} />
              </div>
            )}

            <div className="work-content" ref={contentRef}>
              {contentBlocks.map(block => (
                <LayoutBlockComponent
                  key={`${block.order}_${block.type}`}
                  block={block}
                  meta={meta}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <PageFooter revealClass="anim" />
    </>
  )
}

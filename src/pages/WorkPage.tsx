import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import LayoutBlockComponent from '../components/LayoutBlock'
import PageFooter from '../components/PageFooter'
import { parseLayout, resolveAssets } from '../lib/parseLayout'
import type { WorkMeta, LayoutBlock } from '../types/work'

export default function WorkPage({ onTheme }: { onTheme?: (theme: Record<string, string> | null) => void }) {
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
  const creditsBlock = blocks.find(b => b.type === 'CREDITS')
  const contentBlocks = blocks.filter(b => b.type !== 'FULLHERO')

  // Parse team names from CREDITS for mobile metadata row
  const creditsRaw = creditsBlock?.text?.split(/\n---\n/)[0] ?? ''
  const teamNames = creditsRaw
    .split('\n')
    .map(l => l.replace(/^\*+|\*+$/g, '').trim())
    .filter(l => l && l.toLowerCase() !== 'team')
  const typeList = meta.categories?.split(',').map(c => c.trim()).filter(Boolean) ?? []

  return (
    <>
      <div className="page page--work anim anim-2">
        <section className="work-header">
          <div className="work-header__top">
            <div className="work-header__title-group">
              <div className="work-breadcrumb">
                <span>Work</span>
                <span className="work-breadcrumb__sep">/</span>
                <span>{meta.title}</span>
              </div>
              <h1 className="work-headliner">{meta.headliner}</h1>
            </div>
          </div>
        </section>
      </div>

      {heroBlock && (
        <div className="work-hero reveal in-view" style={{ '--reveal-delay': '0s' } as React.CSSProperties}>
          <LayoutBlockComponent block={heroBlock} heroVtName={`hero-${slug?.replace(/\s+/g, '-')}`} />
        </div>
      )}

      {/* Mobile-only metadata row: Team + Type */}
      <div className="work-metadata-mobile">
        <div className="work-metadata-mobile__col">
          <p className="work-metadata-mobile__label">Team</p>
          <div className="work-metadata-mobile__values">
            {teamNames.map(n => <p key={n}>{n}</p>)}
          </div>
        </div>
        <div className="work-metadata-mobile__col">
          <p className="work-metadata-mobile__label">Type</p>
          <div className="work-metadata-mobile__values">
            {typeList.map(t => <p key={t}>{t}</p>)}
          </div>
        </div>
      </div>

      <div className="page page--work">
        <div className="work-content" ref={contentRef}>
          {contentBlocks.map(block => (
            <LayoutBlockComponent
              key={`${block.order}_${block.type}`}
              block={block}
              categories={block.type === 'CREDITS' ? meta.categories : undefined}
            />
          ))}
        </div>
      </div>

      <PageFooter revealClass="anim" />
    </>
  )
}

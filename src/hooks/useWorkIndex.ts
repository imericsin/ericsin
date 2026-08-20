import { useEffect, useState } from 'react'
import type { WorkMeta } from '../types/work'

// Minimal YAML frontmatter parser (avoids gray-matter Node.js deps in browser).
// Only handles the block-scalar ("|") case for keys we actually read here
// (role) — theme/links parsing lives in parseLayout.ts for the full page.
function parseFrontmatter(raw: string): Partial<WorkMeta> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const result: Record<string, unknown> = {}
  let blockKey: string | null = null
  const blockLines: string[] = []
  const flushBlock = () => {
    if (blockKey) result[blockKey] = blockLines.join('\n').trimEnd()
    blockKey = null
    blockLines.length = 0
  }
  for (const line of match[1].split('\n')) {
    if (blockKey !== null) {
      if (line.match(/^\s+/) || line === '') {
        blockLines.push(line.trim())
        continue
      }
      flushBlock()
    }
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (!m) continue
    const [, key, val] = m
    if (val.trim() === '|') {
      blockKey = key
      continue
    }
    if (val === 'true') result[key] = true
    else if (val === 'false') result[key] = false
    else result[key] = val.replace(/^["']|["']$/g, '')
  }
  flushBlock()
  return result as Partial<WorkMeta>
}

export interface WorkCard {
  slug: string
  name: string
  headliner: string
  categories: string
  thumb: string
  thumbType: 'image' | 'video'
  date: string
  dateRange: string
  featured: boolean
}

/** Case studies that ship a hand-made thumbnail.webp alongside the jpg. The
 *  webp is dramatically smaller at card size (VICTORY+ is 2063KB → 59KB) and
 *  only ever used for the card grid — case-study heroes come from FULLHERO
 *  layout blocks and are untouched by this. */
const WEBP_THUMBS = new Set([
  'LilyLink',
  'ProducerAI',
  'REVOPS',
  'Teladerma',
  'VICTORY-PLUS',
  'You',
])

function resolveThumb(
  base: string,
  thumbFile: string | undefined,
  slug: string
): { src: string; type: 'image' | 'video' } | null {
  if (!thumbFile) return null
  const isVideo = /\.(mp4|webm|mov)$/i.test(thumbFile)
  if (!isVideo && WEBP_THUMBS.has(slug)) {
    return { src: `${base}/${thumbFile.replace(/\.(jpe?g|png)$/i, '.webp')}`, type: 'image' }
  }
  return { src: `${base}/${thumbFile}`, type: isVideo ? 'video' : 'image' }
}

interface WorkIndexOptions {
  featuredOnly?: boolean
  limit?: number
}

export function useWorkIndex({ featuredOnly = true, limit }: WorkIndexOptions = {}) {
  const [cards, setCards] = useState<WorkCard[]>([])

  useEffect(() => {
    async function load() {
      const r = await fetch('/work/index.json')
      if (!r.ok) return
      const slugs: string[] = await r.json()

      const results = await Promise.all(
        slugs.map(async (slug) => {
          const base = `/work/${slug.replaceAll(' ', '%20')}`
          const mdRes = await fetch(`${base}/layout.md`)
          if (!mdRes.ok) return null
          const raw = await mdRes.text()
          const meta = parseFrontmatter(raw)

          if (featuredOnly && !meta.featured) return null
          if (!meta.date) return null

          const hero = resolveThumb(base, meta.thumb, slug)
          if (!hero) return null

          const roleLines = meta.role?.split('\n').filter(Boolean) ?? []

          return {
            slug,
            name: meta.title ?? '',
            headliner: meta.headliner ?? meta.title ?? '',
            categories: meta.categories ?? '',
            thumb: hero.src,
            thumbType: hero.type,
            date: meta.date!,
            dateRange: roleLines[1] ?? '',
            featured: !!meta.featured,
          } satisfies WorkCard
        })
      )

      const filtered = results
        .filter((c): c is WorkCard => c !== null)
        .sort((a, b) => b.date.localeCompare(a.date))

      setCards(limit ? filtered.slice(0, limit) : filtered)
    }

    load()
  }, [featuredOnly, limit])

  return cards
}

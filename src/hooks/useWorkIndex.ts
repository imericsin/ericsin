import { useEffect, useState } from 'react'
import type { WorkMeta } from '../types/work'

// Minimal YAML frontmatter parser (avoids gray-matter Node.js deps in browser)
function parseFrontmatter(raw: string): Partial<WorkMeta> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const result: Record<string, unknown> = {}
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (!m) continue
    const [, key, val] = m
    if (val === 'true') result[key] = true
    else if (val === 'false') result[key] = false
    else result[key] = val.replace(/^["']|["']$/g, '')
  }
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
}

async function resolveHeroAsset(base: string): Promise<{ src: string; type: 'image' | 'video' } | null> {
  try {
    // Try thumbnail.mp4 first, then thumbnail.webp, then thumbnail.jpg
    for (const [name, type] of [['thumbnail.mp4', 'video'], ['thumbnail.webp', 'image'], ['thumbnail.jpg', 'image']] as const) {
      const res = await fetch(`${base}/${name}`, { method: 'HEAD' })
      if (res.ok) return { src: `${base}/${name}`, type }
    }
    return null
  } catch {
    return null
  }
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

          const hero = await resolveHeroAsset(base)
          if (!hero) return null

          return {
            slug,
            name: meta.title ?? '',
            headliner: meta.headliner ?? meta.title ?? '',
            categories: meta.categories ?? '',
            thumb: hero.src,
            thumbType: hero.type,
            date: meta.date!,
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

import type { LayoutBlock, LayoutType, AssetFile, WorkMeta } from '../types/work'

// Inline YAML frontmatter parser — avoids gray-matter Node.js dep in browser
function parseFrontmatter(raw: string): { meta: WorkMeta; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { meta: { title: '' }, content: raw }

  const yaml = match[1]
  const content = match[2]
  const meta: Record<string, unknown> = {}
  const theme: Record<string, string> = {}
  let inTheme = false

  const lines = yaml.split('\n')
  let blockKey: string | null = null
  const blockLines: string[] = []
  let inLinks = false
  let currentLink: Record<string, string> | null = null
  const links: { label: string; url: string; date?: string }[] = []

  const flushBlock = () => {
    if (blockKey) meta[blockKey] = blockLines.join('\n').trimEnd()
    blockKey = null
    blockLines.length = 0
  }

  const flushLink = () => {
    if (currentLink && currentLink.label && currentLink.url) {
      links.push(currentLink as { label: string; url: string; date?: string })
    }
    currentLink = null
  }

  for (const line of lines) {
    // Inside a block scalar (|)
    if (blockKey !== null) {
      if (line.match(/^\s+/) || line === '') {
        blockLines.push(line.trim())
        continue
      }
      flushBlock()
    }

    if (line.trim() === 'theme:') { inTheme = true; inLinks = false; continue }
    if (line.trim() === 'links:') { inLinks = true; inTheme = false; continue }

    if (inLinks) {
      const listItem = line.match(/^\s+-\s+(\w+):\s*(.+)$/)
      const listProp = line.match(/^\s{4,}(\w+):\s*(.+)$/)
      if (line.match(/^\s+-\s+/)) {
        // new list item starting with "- key: val"
        flushLink()
        currentLink = {}
        const m = line.match(/^\s+-\s+(\w+):\s*(.+)$/)
        if (m) currentLink[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
        continue
      } else if (listProp && currentLink) {
        currentLink[listProp[1]] = listProp[2].replace(/^["']|["']$/g, '').trim()
        continue
      } else if (line.trim() === '' || line.match(/^\S/)) {
        flushLink()
        inLinks = false
        if (line.trim() === '') continue
      }
    }

    if (inTheme) {
      const tm = line.match(/^\s+(--[\w-]+):\s*["']?(#[\w]+)["']?/)
      if (tm) { theme[tm[1]] = tm[2]; continue }
      inTheme = false
    }

    const m = line.match(/^([\w-]+):\s*(.*)$/)
    if (!m) continue
    const [, key, val] = m
    if (val.trim() === '|') {
      blockKey = key
      continue
    }
    const clean = val.replace(/^["']|["']$/g, '').trim()
    if (clean === 'true') meta[key] = true
    else if (clean === 'false') meta[key] = false
    else meta[key] = clean
  }
  flushBlock()
  flushLink()
  if (links.length) meta['links'] = links

  if (Object.keys(theme).length) meta['theme'] = theme

  return { meta: meta as unknown as WorkMeta, content }
}

export function parseLayout(raw: string, _slug: string): { meta: WorkMeta; blocks: LayoutBlock[] } {
  const { meta, content } = parseFrontmatter(raw)

  const lines = content.split('\n')
  const blocks: LayoutBlock[] = []
  let current: LayoutBlock | null = null
  let textBuffer: string[] = []

  const flush = () => {
    if (current) {
      current.text = textBuffer.join('\n').trim() || undefined
      blocks.push(current)
      textBuffer = []
    }
  }

  for (const line of lines) {
    const match = line.match(/^::(\d{2})_([A-Z0-9]+)$/)
    if (match) {
      flush()
      current = {
        order: match[1],
        type: match[2] as LayoutType,
        assets: [],
      }
    } else if (current) {
      textBuffer.push(line)
    }
  }
  flush()

  return { meta, blocks }
}

export function resolveAssets(filenames: string[], slug: string, blocks: LayoutBlock[]): LayoutBlock[] {
  const ASSET_RE = /^(\d{2})_([A-Z0-9]+)_(Image|Video|hero)(?:-(\d{1,2}))?\.(\w+)$/i

  const assets: AssetFile[] = []

  for (const filename of filenames) {
    const match = filename.match(ASSET_RE)
    if (!match) continue
    const [, order, layoutType, kind, slot] = match
    assets.push({
      order,
      layoutType: layoutType as LayoutType,
      kind: kind.toLowerCase() === 'video' ? 'Video' : 'Image',
      slot: slot ? slot.padStart(2, '0') : '01',
      src: `/work/${slug}/assets/${filename}`,
    })
  }

  // Pair mp4 videos with their jpg fallbacks
  for (const asset of assets) {
    if (asset.kind === 'Video') {
      const fallback = assets.find(
        a => a.order === asset.order && a.kind === 'Image' && a.slot === asset.slot
      )
      if (fallback) asset.fallback = fallback.src
    }
  }

  const videoKeys = new Set(assets.filter(a => a.kind === 'Video').map(a => `${a.order}_${a.slot}`))

  return blocks.map(block => ({
    ...block,
    assets: assets.filter(a => {
      if (a.order !== block.order) return false
      if (a.kind === 'Image' && videoKeys.has(`${a.order}_${a.slot}`)) return false
      return true
    }).sort((a, b) => a.slot.localeCompare(b.slot)),
  }))
}

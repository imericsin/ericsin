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

  for (const line of yaml.split('\n')) {
    if (line.trim() === 'theme:') { inTheme = true; continue }

    if (inTheme) {
      // Theme lines: "  --token: "#hexval""
      const tm = line.match(/^\s+(--[\w-]+):\s*["']?(#[\w]+)["']?/)
      if (tm) { theme[tm[1]] = tm[2]; continue }
      inTheme = false
    }

    const m = line.match(/^([\w-]+):\s*(.*)$/)
    if (!m) continue
    const [, key, val] = m
    const clean = val.replace(/^["']|["']$/g, '').trim()
    if (clean === 'true') meta[key] = true
    else if (clean === 'false') meta[key] = false
    else meta[key] = clean
  }

  if (Object.keys(theme).length) meta['theme'] = theme

  return { meta: meta as WorkMeta, content }
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
  const ASSET_RE = /^(\d{2})_([A-Z0-9]+)_(Image|Video|hero)(?:-(\d{2}))?\.(\w+)$/i

  const assets: AssetFile[] = []

  for (const filename of filenames) {
    const match = filename.match(ASSET_RE)
    if (!match) continue
    const [, order, layoutType, kind, slot] = match
    assets.push({
      order,
      layoutType: layoutType as LayoutType,
      kind: kind.toLowerCase() === 'video' ? 'Video' : 'Image',
      slot: slot ?? '01',
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

// Frontmatter parsed from each work/[slug]/layout.md
export interface WorkMeta {
  title: string
  headliner?: string
  categories?: string
  featured?: boolean
  date?: string        // YYYY-MM format
  theme?: WorkTheme
}

// Placeholder theme shape — slots will be named from Figma semantics
export interface WorkTheme {
  // e.g. --color-text-primary, --color-surface, etc.
  // Left intentionally loose until Figma variables are shared
  [key: string]: string
}

// A single parsed block from layout.md
export type LayoutType =
  | 'FULLHERO'
  | 'FULL'
  | '2COL'
  | '3COL'
  | 'TEXT'
  | 'CREDITS'

export interface LayoutBlock {
  order: string        // e.g. "01", "02"
  type: LayoutType
  text?: string        // prose content following the tag (if any)
  assets: AssetFile[] // resolved asset files for this block
}

export interface AssetFile {
  order: string        // matches block order
  layoutType: LayoutType
  kind: 'Image' | 'Video'
  slot: string         // e.g. "01", "02" for column position
  src: string          // resolved public path
  fallback?: string    // jpg fallback for video
}


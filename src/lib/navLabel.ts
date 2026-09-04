// v6.5 only: static (non-case-study) nav metadata, keyed by route — e.g.
// Archives' "Archived Work • 2013—2026" (see NavbarV2.tsx/NavMobile.tsx's
// navLabel prop, node 3625:108152). Shared by Nav.tsx and NavMobile.tsx so
// the mapping only lives in one place.
export interface NavLabel {
  title: string
  meta: string
}

export function getNavLabel(pathname: string): NavLabel | null {
  if (pathname === '/archives') return { title: 'Archived Work', meta: '2013—2026' }
  return null
}

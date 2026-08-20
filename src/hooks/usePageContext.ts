import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { parseLayout } from '../lib/parseLayout'
import type { WorkCard } from './useWorkIndex'

/** Strips HTML comments and markdown headings down to plain prose. */
function toProse(text: string) {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*-{3,}\s*$/gm, '')   // block separators, not content
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Describes whatever the user is currently looking at, so the chat can answer
 * questions about the page rather than only about Eric in general.
 *
 * On a case study this reads the study's actual layout.md — the written copy,
 * role, industry and press links — plus any expandedcontext.md notes. On the
 * work index it lists the projects currently visible.
 */
export function usePageContext(cards: WorkCard[], activeTab: string | null) {
  const { pathname } = useLocation()
  const [context, setContext] = useState('')

  useEffect(() => {
    let cancelled = false

    async function build() {
      const parts: string[] = [`The user is currently viewing: ${pathname}`]

      const workMatch = /^\/work\/(.+)$/.exec(pathname)
      if (workMatch) {
        const slug = decodeURIComponent(workMatch[1])

        // The case study's own content — this is what's literally on screen.
        try {
          const r = await fetch(`/work/${encodeURIComponent(slug)}/layout.md`)
          if (r.ok) {
            const { meta, blocks } = parseLayout(await r.text(), slug)
            parts.push(`They are reading the "${meta.title}" case study — ${meta.headliner ?? ''}`.trim())

            const facts: string[] = []
            if (meta.categories) facts.push(`Categories: ${meta.categories}`)
            if (meta.role) facts.push(`Role: ${meta.role.split('\n').filter(Boolean).join(', ')}`)
            if (meta.industry) facts.push(`Industry: ${meta.industry.split('\n').filter(Boolean).join(', ')}`)
            if (meta.scope) facts.push(`Scope: ${meta.scope.split('\n').filter(Boolean).join(', ')}`)
            if (facts.length) parts.push(facts.join('\n'))

            const body = blocks.map(b => b.text).filter(Boolean).map(t => toProse(t!)).filter(Boolean)
            if (body.length) parts.push(`The written content of this case study:\n\n${body.join('\n\n')}`)

            if (meta.links?.length) {
              parts.push(
                'Press / links featured on this page:\n' +
                meta.links.map(l => `- ${l.label}${l.date ? ` (${l.date})` : ''}: ${l.url}`).join('\n')
              )
            }
          }
        } catch { /* unreadable layout — fall through to the card summary */ }

        // Fall back to index metadata if layout.md gave us nothing.
        if (parts.length === 1) {
          const card = cards.find(c => c.slug === slug)
          if (card) {
            parts.push(
              `They are reading the "${card.name}" case study — ${card.headliner}.`,
              `Categories: ${card.categories}. Timeframe: ${card.dateRange}.`
            )
          }
        }

        // Optional hand-written notes, if any have been filled in.
        try {
          const r = await fetch(`/work/${encodeURIComponent(slug)}/expandedcontext.md`)
          if (r.ok) {
            const extra = toProse(await r.text())
            if (extra) parts.push(`Additional notes on this case study:\n${extra}`)
          }
        } catch { /* no context file — fine */ }
      } else if (pathname === '/') {
        parts.push(
          activeTab
            ? `They are on the work index, filtered to "${activeTab}".`
            : 'They are on the work index (all projects).'
        )
        if (cards.length) {
          parts.push(
            'Projects visible in the list:',
            cards.map(c => `- ${c.name} (${c.categories}, ${c.dateRange}): ${c.headliner}`).join('\n')
          )
        }
      } else if (pathname === '/about') {
        parts.push('They are on the About page, reading Eric’s background and experience.')
      } else if (pathname === '/archives') {
        parts.push('They are browsing the Archives — 20+ years of design snippets and older work.')
      }

      if (!cancelled) setContext(parts.join('\n\n'))
    }

    build()
    return () => { cancelled = true }
  }, [pathname, activeTab, cards])

  return context
}

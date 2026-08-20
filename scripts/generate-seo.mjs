// Generates robots.txt and sitemap.xml from the live work index so new case
// studies appear automatically. Runs as part of `npm run build`.
import { readFileSync, writeFileSync } from 'node:fs'

const ORIGIN = 'https://ericsin.com'
// Dev sandboxes and the legacy /work index shouldn't be indexed.
const DISALLOW = ['/toast-demo', '/prompt-demo', '/api/']
const STATIC = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/archives', priority: '0.6', changefreq: 'monthly' },
]

const slugs = JSON.parse(readFileSync('public/work/index.json', 'utf8'))

/** Newest case-study date, used as the sitemap's lastmod. */
function lastmodFor(slug) {
  try {
    const md = readFileSync(`public/work/${slug}/layout.md`, 'utf8')
    const m = /^date:\s*(\d{4})-(\d{2})/m.exec(md)
    return m ? `${m[1]}-${m[2]}-01` : null
  } catch { return null }
}

const today = new Date().toISOString().slice(0, 10)

const urls = [
  ...STATIC.map(s => ({ loc: `${ORIGIN}${s.path}`, lastmod: today, ...s })),
  ...slugs.map(slug => ({
    loc: `${ORIGIN}/work/${encodeURIComponent(slug)}`,
    lastmod: lastmodFor(slug) ?? today,
    priority: '0.7',
    changefreq: 'yearly',
  })),
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`

const robots = `User-agent: *
Allow: /
${DISALLOW.map(p => `Disallow: ${p}`).join('\n')}

Sitemap: ${ORIGIN}/sitemap.xml
`

writeFileSync('public/sitemap.xml', sitemap)
writeFileSync('public/robots.txt', robots)
console.log(`generate-seo: ${urls.length} urls (${slugs.length} case studies)`)

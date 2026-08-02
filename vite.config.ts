import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const SUPPORTED = /\.(jpe?g|png|gif|webp|mp4)$/i

function archivesManifestPlugin(): Plugin {
  const archivesDir = path.resolve(__dirname, 'public/archives')

  // Git does not preserve mtimes — every file in a fresh clone carries the
  // checkout time, so on a CI build mtime-based sorting collapses to a single
  // timestamp and every card shows the build date. Dates therefore live in a
  // committed dates.json (YYYY-MM-DD per filename); mtime is only a fallback
  // for files not yet recorded there.
  function buildManifest() {
    if (!fs.existsSync(archivesDir)) return []

    let dates: Record<string, string> = {}
    const datesPath = path.join(archivesDir, 'dates.json')
    if (fs.existsSync(datesPath)) {
      try {
        dates = JSON.parse(fs.readFileSync(datesPath, 'utf-8'))
      } catch {
        dates = {}
      }
    }

    return fs.readdirSync(archivesDir)
      .filter(f => SUPPORTED.test(f) && !f.startsWith('.'))
      .map(filename => {
        const recorded = dates[filename]
        const time = recorded
          ? new Date(`${recorded}T12:00:00`).getTime()
          : fs.statSync(path.join(archivesDir, filename)).mtimeMs
        return { filename, time }
      })
      .sort((a, b) => b.time - a.time)
      .map(({ filename, time }) => {
        const d = new Date(time)
        const dd = String(d.getDate()).padStart(2, '0')
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const yyyy = d.getFullYear()
        return { filename, date: `${dd}.${mm}.${yyyy}` }
      })
  }

  return {
    name: 'archives-manifest',
    configureServer(server) {
      server.middlewares.use('/archives/manifest.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(buildManifest()))
      })
    },
    generateBundle() {
      const manifest = buildManifest()
      this.emitFile({
        type: 'asset',
        fileName: 'archives/manifest.json',
        source: JSON.stringify(manifest),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), archivesManifestPlugin()],
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3457,
  },
})

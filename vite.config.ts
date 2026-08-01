import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const SUPPORTED = /\.(jpe?g|png|gif|webp|mp4)$/i

function archivesManifestPlugin(): Plugin {
  const archivesDir = path.resolve(__dirname, 'public/archives')

  function buildManifest() {
    if (!fs.existsSync(archivesDir)) return []
    return fs.readdirSync(archivesDir)
      .filter(f => SUPPORTED.test(f) && !f.startsWith('.'))
      .map(filename => {
        const stat = fs.statSync(path.join(archivesDir, filename))
        return { filename, mtime: stat.mtimeMs }
      })
      .sort((a, b) => b.mtime - a.mtime)
      .map(({ filename, mtime }) => {
        const d = new Date(mtime)
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

import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const SUPPORTED = /\.(jpe?g|png|gif|webp|mp4)$/i

// Reads intrinsic pixel dimensions from image headers without decoding the
// file or pulling in an image library. The grid needs these to reserve layout
// space before decode — otherwise every card has zero height on first paint,
// the whole grid collapses into the viewport, and loading="lazy" fetches
// everything at once.
function imageSize(file: string): { w: number; h: number } | null {
  let fd: number | undefined
  try {
    fd = fs.openSync(file, 'r')
    const buf = Buffer.alloc(65536)
    const read = fs.readSync(fd, buf, 0, 65536, 0)
    if (read < 24) return null

    // PNG: IHDR width/height at fixed offsets
    if (buf.readUInt32BE(0) === 0x89504e47) {
      return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
    }
    // GIF: little-endian dimensions in the logical screen descriptor
    if (buf.toString('ascii', 0, 3) === 'GIF') {
      return { w: buf.readUInt16LE(6), h: buf.readUInt16LE(8) }
    }
    // WebP (VP8X / VP8 / VP8L)
    if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
      const fourcc = buf.toString('ascii', 12, 16)
      if (fourcc === 'VP8X') {
        return {
          w: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)),
          h: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)),
        }
      }
      if (fourcc === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff }
      if (fourcc === 'VP8L') {
        const b = buf.readUInt32LE(21)
        return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 }
      }
      return null
    }
    // JPEG: walk segment markers to the SOFn frame header
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let o = 2
      while (o < read - 9) {
        if (buf[o] !== 0xff) { o++; continue }
        const marker = buf[o + 1]
        // SOF0-SOF15, excluding DHT/JPGA/DAC
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { h: buf.readUInt16BE(o + 5), w: buf.readUInt16BE(o + 7) }
        }
        o += 2 + buf.readUInt16BE(o + 2)
      }
    }
    return null
  } catch {
    return null
  } finally {
    if (fd !== undefined) fs.closeSync(fd)
  }
}

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
        const full = path.join(archivesDir, filename)
        const stat = fs.statSync(full)
        const recorded = dates[filename]
        const time = recorded ? new Date(`${recorded}T12:00:00`).getTime() : stat.mtimeMs
        const dim = SUPPORTED.test(filename) && !/\.mp4$/i.test(filename) ? imageSize(full) : null
        return { filename, time, size: stat.size, dim }
      })
      .sort((a, b) => b.time - a.time)
      .map(({ filename, time, size, dim }) => {
        const d = new Date(time)
        const dd = String(d.getDate()).padStart(2, '0')
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const yyyy = d.getFullYear()
        return {
          filename,
          date: `${dd}.${mm}.${yyyy}`,
          size,
          ...(dim ? { width: dim.w, height: dim.h } : {}),
        }
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

#!/usr/bin/env node
/**
 * Keeps public/archives/dates.json in sync with the files on disk.
 *
 * Why this exists: the archives grid sorts newest-first, but git does not
 * preserve mtimes — every file in a fresh CI clone carries the checkout
 * timestamp. Sorting by mtime therefore works locally and collapses to a
 * single date in production. Recording each file's date here, in a committed
 * file, makes the order reproducible on any machine.
 *
 * New files are stamped from their local mtime, which is correct as long as
 * this runs on the machine where the file was added. Existing entries are
 * never overwritten, so a date you've corrected by hand stays put.
 *
 * Usage: node scripts/sync-archive-dates.mjs [--check]
 *   --check  exit 1 if out of sync instead of writing (for CI)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR = path.join(ROOT, 'public/archives')
const FILE = path.join(DIR, 'dates.json')
const SUPPORTED = /\.(jpe?g|png|gif|webp|mp4)$/i

const checkOnly = process.argv.includes('--check')

if (!fs.existsSync(DIR)) {
  console.log('sync-archive-dates: no public/archives directory, nothing to do')
  process.exit(0)
}

const existing = fs.existsSync(FILE)
  ? JSON.parse(fs.readFileSync(FILE, 'utf-8'))
  : {}

const files = fs
  .readdirSync(DIR)
  .filter(f => SUPPORTED.test(f) && !f.startsWith('.'))
  .sort()

const next = {}
const added = []
for (const f of files) {
  if (existing[f]) {
    next[f] = existing[f] // preserve — may have been corrected by hand
  } else {
    const d = new Date(fs.statSync(path.join(DIR, f)).mtime)
    const iso = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-')
    next[f] = iso
    added.push(`${iso}  ${f}`)
  }
}

const removed = Object.keys(existing).filter(f => !(f in next))
const changed = added.length > 0 || removed.length > 0

if (checkOnly) {
  if (changed) {
    console.error('sync-archive-dates: dates.json is out of sync')
    added.forEach(a => console.error(`  + ${a}`))
    removed.forEach(r => console.error(`  - ${r}`))
    console.error('Run: npm run sync:archives')
    process.exit(1)
  }
  console.log(`sync-archive-dates: in sync (${files.length} files)`)
  process.exit(0)
}

if (changed) {
  fs.writeFileSync(FILE, JSON.stringify(next, null, 2) + '\n')
  if (added.length) {
    console.log(`sync-archive-dates: added ${added.length} file(s)`)
    added.forEach(a => console.log(`  + ${a}`))
  }
  if (removed.length) {
    console.log(`sync-archive-dates: dropped ${removed.length} stale entry(ies)`)
    removed.forEach(r => console.log(`  - ${r}`))
  }
} else {
  console.log(`sync-archive-dates: in sync (${files.length} files)`)
}

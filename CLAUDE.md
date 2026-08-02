# Portfolio — working notes

## Archives dates (important)

The `/archives` grid sorts newest-first. **Git does not preserve file mtimes** —
every file in a fresh clone gets the checkout timestamp — so sorting by mtime
works locally but collapses to a single date in production.

Dates therefore live in **`public/archives/dates.json`** (`filename` →
`YYYY-MM-DD`), which is committed. `vite.config.ts` reads it when building the
archives manifest and only falls back to mtime for files not yet recorded.

**When adding archive images:**

- `npm run build` and the pre-commit hook both run `scripts/sync-archive-dates.mjs`,
  which stamps new files from their local mtime and drops stale entries.
- Existing entries are never overwritten, so any date corrected by hand sticks.
- A file's mtime is only meaningful on the machine where it was added. If an
  image was copied or re-exported, its stamp will be the copy date — edit
  `dates.json` directly to set the real one.

**One-time setup in a fresh clone** (hook path is local git config, not committed):

```bash
git config core.hooksPath .githooks
```

Verify sync without writing: `node scripts/sync-archive-dates.mjs --check`

## Case study assets

Each case study has `layout.md` (block sequence + frontmatter) and
`assets.json` (filenames). `resolveAssets` in `src/lib/parseLayout.ts` matches
assets to blocks on the `NN_TYPE_Kind[-NN].ext` pattern; anything not matching
that shape (e.g. `thumbnail.*`) is ignored for block placement.

Block type in `layout.md` must match its assets — a `::03_2COL` with a single
asset renders half-width against an empty text column.

## Fonts

`SF Pro Display` is served from `public/fonts/SF-Pro-Display-*.woff2` (weights
400/500/600/700, Latin subset). Do not point `@font-face` at `SFNS.ttf` — that
is macOS's system font (internal name `.SF NS`) and renders as a different
typeface even though it declares the SF Pro Display family.

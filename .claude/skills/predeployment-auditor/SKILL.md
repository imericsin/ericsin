---
name: predeployment-auditor
description: Full visual/functional QA sweep across every page, subpage, and key interaction at this project's three breakpoints (desktop, tablet, mobile) — run this before opening any PR that touches layout, nav, or CSS. Reports results as a table (pages × breakpoints) with pass/fail tags.
---

# Predeployment auditor (this project)

Run this before pushing any PR that touches `v65.css`, `globals.css`, nav
components, or page layout. It catches the class of bug this project keeps
hitting: a fix at one breakpoint silently breaking, or never reaching,
another — see `figma-mcp-conventions` and past session history for the
recurring "per-property cascade leak" pattern (an unscoped `main` rule wins
on a property a `.v65` override never restated).

## Setup

1. Ensure the dev server is running (`preview_start` with the project's
   `.claude/launch.json` config, not Bash).
2. Confirm `git status` — the audit should run against the actual diff
   being shipped, not a half-finished working tree.

## Breakpoints

This project defines three tiers (see `--v65-content-top` and the
`@media` blocks in `src/styles/v65.css`):

- **Desktop** — default viewport (`resize_window` preset `"desktop"`, or
  any width ≥1200px)
- **Tablet** — 720–1199px (test at ~900px)
- **Mobile** — ≤719px (`resize_window` preset `"mobile"`, 375px)

Some page-specific breakpoints exist too (e.g. main's own unscoped 860px/
640px tiers can leak into `.v65` — see below). Note those as extra columns
only if a bug is actually found there; don't expand the standard grid
for them by default.

## Pages and subpages to cover

Enumerate current routes from `src/App.tsx` before starting — the list
below is a snapshot, not a fixed contract:

- `/` (Home) — tab filter (All/Brand/Product), infinite scroll, social
  links, footer clock
- `/about`
- `/archives` — grid, lightbox open/close/arrow-nav
- `/work/:slug` — test at least 2 case studies, including one with a
  **long title** (multi-word company name) to catch nav-label overflow,
  and one with a video hero vs. an image hero

## Interactions to test per breakpoint

- Nav: Menu button → CommandPalette opens; search mode renders; Tab
  switches to chat mode; chat input autofocuses; Escape/close returns to
  the trigering page state
- Tab/filter controls (Home's Brand/Product, mobile pill row)
- Archives lightbox: open, Escape close, arrow-key next/prev, z-index
  above nav (nav must not bleed through the blur)
- Any breadcrumb/back-link (e.g. case study's "INDEX" link → routes home)
- Hover states only where they carry real information (dimmed nav links
  brightening on hover) — skip decorative hovers

## Procedure per page

For each page: load it, **read console errors** (`read_console_messages`
with `onlyErrors: true`) before screenshotting — a broken render can look
fine in a screenshot while throwing underneath. If HMR shows a stale
`ReferenceError` for a variable that no longer exists in source (this
project's dev server does this after `.tsx` files change extensively),
this is not a real bug: stop the preview server, `rm -rf node_modules/
.vite`, restart, and open a fresh tab — do not report the error as a
finding.

Then screenshot at each breakpoint, and drive at least one interaction on
that page before moving on — a static screenshot doesn't catch a dead
click handler.

## Report format

Report as a table: **rows are pages/subpages, columns are the three
breakpoints.** Each cell is either a checkmark, or a short bug tag plus a
one-line description. Use these tags:

- `visual` — layout, spacing, alignment, overflow, contrast issues that
  don't break functionality
- `functional` — a click/interaction doesn't do what it should, or
  throws an error
- `content` — wrong/missing copy, truncation cutting off real info
- `stale-cascade` — a property leaking through from an unscoped `main`
  rule that a `.v65` override didn't restate (this project's most common
  bug class — see `figma-mcp-conventions`)

Example:

| Page | Desktop | Tablet | Mobile |
|---|---|---|---|
| Home (`/`) | ✅ | ✅ | ✅ |
| Archives (`/archives`) | ✅ | ✅ | `visual` — lightbox close icon 4px off-center |
| Case study, long title (`/work/APMC`) | ✅ | ✅ | `content` — title wraps 2 lines, crowds Menu button |

List subpages (individual case studies) as their own rows when a bug is
specific to one of them; otherwise one row covering "case study" is
enough if every one tested came back clean.

After the table, list any fixes already applied during the audit
separately from bugs still open — don't blend "found and fixed" into the
same cell as "found, not yet fixed."

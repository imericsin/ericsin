---
name: figma-mcp-conventions
description: Project-specific conventions for reading Figma designs via the Figma MCP (get_design_context, get_metadata, get_screenshot) on this portfolio project. Load this whenever a Figma URL/node is being implemented as code — it captures gaps between what the MCP's generated code says and what the layer names/structure actually mean, plus other hand-written notes from the designer about how this Figma file should be interpreted.
---

# Figma MCP working conventions (this project)

`get_design_context`'s generated React+Tailwind output is a **reference**, not
ground truth — it can miss sizing intent that only shows up in the layer
names or the raw node structure. This file collects cases, specific to this
Figma file, where the generated code and the actual design intent diverge,
so those mistakes aren't repeated.

## Read layer names before trusting generated Tailwind classes

Figma's auto-layout "hug contents" vs. "fill container" sizing modes don't
always translate cleanly into the Tailwind `get_design_context` hands back —
a "hug" frame can still come out as `flex-[1_0_0]` in the generated code,
which is a "fill" pattern, not "hug." When a layer's own name states its
sizing mode explicitly (e.g. "Logo (hug)"), trust the name over the
generated class.

**Case: Nav's logo column ("Logo (hug)") — MOBILE ONLY** — node 3606:36229
("Nav New"), under the "Nav Mobile" sub-frame specifically. That logo
container is named "Logo (hug)" in the layer tree, meaning on mobile it's
sized to its content (CSS: `flex: 0 0 auto` / `width: fit-content` — just
wide enough for the 20px dot), not a flexible or percent-based column.

This does **not** apply to the desktop nav ("Nav Desktop" sub-frame under
the same top-level node) — desktop's logo column intentionally matches the
sticky rail's own width (`flex: 1 0 0; min-width: 280px; max-width: 30%`)
so the nav and the rail below it stay visually aligned at every viewport
width. Don't generalize "hug" from the mobile frame to the desktop one
just because they're siblings in the same top-level node — check which
sub-frame (desktop vs. mobile) a layer name actually belongs to before
applying its sizing convention elsewhere.

**Action for this component:** `.nav-mobile`'s logo slot hugs its content;
`.navbar-v2__left` (desktop) stays matched to the rail's width.

## General rule going forward

When a `get_design_context` call returns sizing (`flex-*`, `w-*`, `max-w-*`)
that seems inconsistent with how the surrounding layout should behave, pull
`get_metadata` on the same node (or its parent) and read the actual layer
names before committing to the generated values. Ask the user directly if a
layer name is ambiguous rather than guessing from the screenshot alone.

## Add to this file

Whenever the user shares a correction about how a specific Figma node,
layer-naming pattern, or file-wide convention should be read (especially
anything Figma's tooling can't express directly and they've had to encode
as a layer name or comment), add it here as its own dated/titled case,
following the format above: what the layer says, what the MCP generated,
what the actual intent is, and which component it affects.

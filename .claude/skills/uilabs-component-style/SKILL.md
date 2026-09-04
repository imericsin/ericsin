---
name: uilabs-component-style
description: Generate or restyle a UI component (button, card, toolbar, modal, badge, dropdown, etc.) using the uilabs.dev design language — restrained grayscale palette with a single accent, border-vs-shadow hierarchy, semantic corner radius, split display/functional typography, motion-first interactions. Use when the user asks to build, design, or style a UI component and wants this specific "small laboratory of fine UI" aesthetic, or explicitly references uilabs.dev / mrncst's component style.
---

# uilabs.dev component style

Generate new UI components (or restyle existing ones) in the aesthetic of
[uilabs.dev](https://uilabs.dev) (components by mrncst). This is not a component
library to import — there's no public package — it's a **visual language** to
apply when writing component code from scratch (React + Tailwind + Framer
Motion is the stack the reference site uses, but the principles apply to any
framework).

Work in two steps:

## Step 1 — Apply the baked-in principles

Use `reference/principles.md` as the primary source of truth. It encodes five
rules, derived from direct inspection of the live site:

1. **Restraint with one loud accent** — grayscale base (off-white canvas,
   white surfaces, near-black text), one accent color reserved strictly for
   status/attention/brand (never a default button fill).
2. **Border vs. shadow as a hierarchy tool** — outer structural containers get
   a 1px hairline border; inner floating/interactive elements (toolbars,
   badges, cards-within-cards) get a soft shadow instead. Never stack both on
   the same edge.
3. **Radius maps to semantics** — full/pill radius for anything transient or
   status-like (toolbars, badges, chips, tabs); medium radius (`rounded-xl`/
   `2xl`, ~12–16px) for content containers. Avoid sharp corners entirely.
4. **Split typography** — one display/expressive typeface for headline/brand
   moments only, one clean grotesque sans for all functional UI text, and
   monospace reserved exclusively for literal/technical strings (paths,
   hashes, code-like values). Never mix these roles.
5. **Motion-first, chrome-second** — static styling stays deliberately simple
   so it doesn't compete with interaction/motion for attention. Prefer subtle
   transitions (hover, state change, expand/collapse) over decorative static
   styling.

Read `reference/principles.md` in full before generating code — it has the
concrete token values (colors, radius scale, shadow values, spacing) to apply,
not just the prose rules above.

When generating a component:

- Identify which of the five rules are load-bearing for *this* component type
  (e.g. a badge cares most about rule 3 + rule 1; a modal cares most about
  rule 2 + rule 4).
- Default to the token values in `reference/principles.md` rather than
  inventing new colors/radii/shadows.
- If the user's existing codebase already has a design system or token file,
  reconcile: keep their existing color tokens/semantic names, but apply the
  *structural* rules (radius taxonomy, border/shadow split, type split) from
  this skill on top of them. Don't force the exact uilabs palette into a
  codebase that already has its own.

## Step 2 — Audit against the live site

After generating the component, treat `reference/principles.md` as
potentially stale — it's a snapshot, not a live source. Run a quick audit:

1. Fetch the current https://uilabs.dev in a browser tool.
2. Screenshot 2–4 components of a similar *type* to what was just built (e.g.
   if you built a toolbar, look at Action Toolbar / Contextual Toolbar; if you
   built a card, look at the Design Sync / Elastic Card examples).
3. Compare against what was generated: check accent color usage, radius
   choice, border-vs-shadow placement, and type pairing.
4. Note any drift (site has since shifted palette, added a new pattern not
   covered in the reference doc, etc.) and:
   - Apply corrections to the generated component if the drift is clearly a
     principle miss (e.g. you used a shadow on an outer frame where the site
     consistently uses a border).
   - If the site itself has visibly evolved in a way that contradicts
     `reference/principles.md`, flag it to the user and offer to update the
     reference doc — don't silently rewrite the shared reference without
     telling them, since other consumers of this skill rely on it.

Skip Step 2 only if the user is offline/has no browser tool available, or
explicitly says to skip the audit — say so explicitly rather than silently
omitting it.

## Output expectations

- Produce working component code (framework matching the user's project, or
  React + Tailwind if unspecified/greenfield), not just a description.
- Keep Framer Motion (or the project's existing animation library) transitions
  short and purposeful — hover/tap scale, height/opacity expand, spring for
  playful elements — matching rule 5. Don't animate everything; static
  elements should stay static.
- Briefly note (1–2 sentences, not a report) which of the five rules most
  shaped the output, so the user can sanity-check the styling choice.

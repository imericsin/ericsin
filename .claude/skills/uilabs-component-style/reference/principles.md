# uilabs.dev design principles (reference snapshot)

Derived from direct visual inspection of https://uilabs.dev (components by
mrncst) in August 2026. This is a **snapshot**, not a live feed — see
`SKILL.md` Step 2 for how to audit it against the current site before trusting
it blindly on a high-stakes build.

## Color

- Base canvas: off-white / very light gray (`gray-50`-ish, e.g. `#FAFAFA`–`#F7F7F8`).
- Component surfaces: pure white (`#FFFFFF`), or near-black (`#0A0A0A`–`#111111`)
  for a small number of "elevated/active" components — never a mid-gray fill.
- Text: near-black on light surfaces, off-white on dark surfaces. No colored
  body text.
- **One accent color**: a hot pink/magenta (approx. `#F0296D`–`#EC2C6B`).
  Reserved for:
  - status/alert signals ("Failed" badge, "In 15 mins" pill)
  - the brand mark / byline
  - small interactive highlights (active tab underline, icon accent)
  - It is **never** a default/primary button fill. Buttons and primary
    actions stay black/white/gray; pink is a signal, not a decoration.
- Metadata/tag text (framework pills like `react`, `tailwindcss`) uses a
  muted, low-contrast gray — deliberately quiet so it doesn't compete with
  the component demo itself.

## Border vs. shadow (hierarchy tool)

- **Outer structural containers** (the frame around a component demo, a page
  section) → 1px hairline border, very light gray (`border-gray-200`-ish),
  no shadow.
- **Inner floating/interactive elements** (toolbars, cards, badges, popovers
  sitting *inside* a container) → soft drop shadow, no border (or an
  extremely faint border at most).
- Rule of thumb: never put both a border and a shadow on the same edge of the
  same element. Pick one based on whether the element is "structural" (border)
  or "elevated/floating" (shadow).
- Shadow values stay soft and diffuse — large blur, low opacity, no hard
  offset. Think `0 4px 20px rgba(0,0,0,0.08)`, not a crisp drop shadow.

## Radius (semantic, not decorative)

- **Full/pill radius** (`border-radius: 9999px` / Tailwind `rounded-full`):
  - toolbars, status badges/pills, tag chips, tab groups, nav pills
  - anything transient, ephemeral, or representing a small discrete state
- **Medium radius** (`12–16px`, Tailwind `rounded-xl`/`rounded-2xl`):
  - content cards, modals, demo frames — anything that "contains" other
    content rather than being a single atomic control
- Sharp corners (`radius: 0`) essentially don't appear. If unsure which
  bucket a component falls into, default to medium radius for containers and
  pill radius for controls/status.

## Typography (split by role)

- **Display/expressive typeface**: used only for hero headlines / brand
  moments. On uilabs.dev this is a bold pixel-serif display face — the
  specific face doesn't matter as much as the *rule*: this face never appears
  in functional UI copy.
- **Functional sans**: a clean grotesque (Inter-like) for all UI chrome —
  labels, body copy, buttons, card titles. This carries ~95% of the on-screen
  text.
- **Monospace**: reserved exclusively for literal/technical strings — file
  paths (`/settings`, `/create-project`), commit hashes (`2e860de`), code-like
  values. Using monospace is itself a signal to the user "this is a literal
  value," so don't use it decoratively.
- Type scale steps down clearly between a title and its supporting metadata
  (e.g. "Design Sync" at ~16px semibold, "1:30PM → 2:30PM" at ~14px regular,
  muted color) — consistent two-level hierarchy inside any card/list item.

## Spacing

- Generous horizontal padding relative to height on pill-shaped elements —
  they read as capsules, not tightly-wrapped text. Roughly 2:1 to 3:1
  horizontal:vertical padding ratio on pills/badges.
- Consistent, small vertical gap (~4px) between a title and its metadata line
  when stacked.
- Demo/container frames have noticeably more internal padding than the
  controls inside them — content never touches the container edge.

## Motion

- Framer Motion (or equivalent) drives most of the interest — hover states,
  expand/collapse, state transitions (e.g. toolbar swapping from idle to
  "commit failed" state).
- Static styling is kept deliberately simple *so it doesn't compete with
  motion for attention*. If a component's resting state feels like it needs
  more visual decoration to feel "finished," the fix is usually to add a
  micro-interaction, not more static styling (more shadow, more color, more
  border weight).
- Prefer spring-based easing for playful/small elements (badges, cards),
  smoother duration-based easing for larger layout shifts (panels, modals).

## Quick checklist when generating a component

- [ ] Base surface is white or off-white; no accent color used as a fill
      unless this element *is* a status/alert.
- [ ] Exactly one of {border, shadow} applied per element, chosen by whether
      it's structural or floating.
- [ ] Radius chosen from the two-bucket system (pill vs. medium), not an
      arbitrary value.
- [ ] No display/expressive font in functional copy; no monospace on
      non-literal text.
- [ ] If there's a resting-state urge to add more visual weight, consider a
      motion/interaction fix first.

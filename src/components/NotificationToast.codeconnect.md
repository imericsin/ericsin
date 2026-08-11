# NotificationToast — Code Connect Spec

Covers three components: `NotificationToast`, `CycleController`, `IconButton`.
Source: `src/components/NotificationToast.tsx`, `CycleController.tsx`, `IconButton.tsx`.

---

## NotificationToast

**Figma node:** 3437:21087
**File:** `src/components/NotificationToast.tsx`

### Structure

Two-column layout: a fixed 40×40 asset slot on the left, a flexible text/metadata column on the right, with the `CycleController` absolutely positioned in the bottom-right corner (`.toast__cycle`).

### Props

| Prop | Type | Required | Notes |
|---|---|---|---|
| `items` | `ToastItem[]` | yes | Full list backing the cycle controller. |
| `index` | `number` | yes | Currently displayed item; owned by the parent (see `ToastFeed`). |
| `onIndexChange` | `(index: number) => void` | yes | Called on prev/next click. |
| `className` | `string` | no | Appended to root `.toast`. |

### `ToastItem`

| Field | Type | Required | Notes |
|---|---|---|---|
| `assetSrc` | `string` | no | Image URL for the 40×40 slot. When omitted, the entire asset column (`.toast__asset`) is not rendered — the body column fills the full width instead. |
| `assetAlt` | `string` | no | Defaults to `''` (decorative). |
| `title` | `string` | no | Optional bold lead-in line rendered above `copy`, forced onto its own line via `<br/>` (e.g. "**Aug. 11 Update**" then "Added \"Archives\" Page" below). Use for update-style entries with a short bold label; omit for plain social-post copy. |
| `copy` | `string` | yes | Fills the remaining line(s) in the fixed 2-line, 36px-tall clamp box (`-webkit-line-clamp: 2`). When `title` is present, `copy` effectively gets 1 line before truncating; without `title`, it gets both. |
| `label` | `string` | yes | Rendered as-is (no automatic "via" prefix — include it in the string if wanted, e.g. `"via LinkedIn"` or a bare `"ericsin.com/archives"`). Doubles as the link label. |
| `href` | `string` | no | If present, `label` renders as `<a target="_blank">` (no underline; text color darkens on its own hover). If absent, renders as plain `<span>` (non-interactive). |

### States

- **Base** — `.toast__meta` shows the `label` text, clickable when `href` is present.
- **Hover (card)** — Shadow intensifies and the whole card shifts `translateY(1px)` (subtle "pushed down" feel, kept deliberately faint). Background lightens to `#f7f7f7`. Asset border color shifts from `--component-bg-2` to `--component-bg-3`.
- **Hover (label link)** — Text color darkens from `--component-fg-2` to `--component-fg-1`; no underline in any state.

### Behavior notes

- Copy truncation and metadata height are both fixed, so card height never reshuffles as `items` changes.
- Metadata/link previously used a rolodex-style clip-mask swap between two rows (default text vs. a separate "View Link" hover row) — removed in favor of a single always-visible, directly clickable "via {via}" line.

---

## CycleController

**Figma node:** 3437:20600
**File:** `src/components/CycleController.tsx`

Always visible on the toast (not hover-gated, per current spec — may change later). Wraps two `IconButton`s.

### Props

| Prop | Type | Required | Notes |
|---|---|---|---|
| `onPrev` | `() => void` | yes | |
| `onNext` | `() => void` | yes | |
| `hasPrev` | `boolean` | yes | Disables the left `IconButton` at `index === 0`. |
| `hasNext` | `boolean` | yes | Disables the right `IconButton` at the last item. |

Cycles across a maximum of 3 stacked cards (see `ToastFeed`); bounds are clamped by the parent, not by this component.

---

## IconButton

**Figma node:** 3437:20971
**File:** `src/components/IconButton.tsx`

### Props

| Prop | Type | Required | Notes |
|---|---|---|---|
| `direction` | `'left' \| 'right'` | yes | The base exported glyph points left; `'right'` applies `scaleX(-1)` to mirror it rather than fetching a second asset. |
| `onClick` | `() => void` | yes | |
| `disabled` | `boolean` | no | Sets `opacity: 0.35`, `pointer-events: none`. |
| `aria-label` | `string` | yes | Required — glyph is decorative (`aria-hidden`). |

### States

- **Default** — `chevron-default.svg` (light bg-opacity, `#999` stroke).
- **Hover** — crossfades to `chevron-hover.svg` (darker bg-opacity, `#121212` stroke) via opacity transition; both images are stacked absolutely and swapped, not recolored at runtime.
- **Disabled** — dimmed, non-interactive.

### Hit target

Visible glyph is 16×16, but the button's hit area is 20×20 (2px padding on all sides) so hover/tap doesn't require pixel-precise pointing at the small icon.

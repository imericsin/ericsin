import { Link } from 'react-router-dom'
import IconCmdk from './IconCmdk'

export interface TabDef {
  label: string
  count: number
}

interface Props {
  variant: 'index' | 'about-archives'
  tabs?: TabDef[]
  activeTab?: string | null
  onTabChange?: (label: string | null) => void
  // v6.5 only: set while on a case study page — replaces the site
  // identity with an "INDEX / {title}" breadcrumb, LabelMono, same
  // reversed-emphasis pattern as .nav-label--mono-crumb below (node
  // 3630:108190). Was "Work / {title}" in SF Pro Display before this.
  workTitle?: string | null
  // v6.5 only: set on pages with static (non-case-study) nav metadata —
  // e.g. Archives' "Archived Work • 2013—2026" (see node 3625:108152).
  // Same slot as workTitle's breadcrumb, but plain text, no link, and a
  // "•" separator instead of "/". Now rendered in LabelMono per the latest
  // pass of node 3625:108109 — the earlier "INDEX / {label}" breadcrumb
  // variant tried for this slot didn't stick; the design reverted to this
  // simpler in-place label, just re-typed.
  navLabel?: { title: string; meta: string } | null
  /** Opens the CMD+K CommandPalette — the "Menu" button now replaces the
   *  hamburger overlay everywhere on desktop, including case studies as
   *  of node 3630:108190 (the last page still on the old MenuIcon path). */
  onOpenPalette?: () => void
}

export default function NavbarV2({
  variant,
  tabs,
  activeTab = null,
  onTabChange,
  workTitle,
  navLabel,
  onOpenPalette,
}: Props) {
  // Index-only: the tab row itself is now the nav label (LabelMono "ALL /
  // BRAND / PRODUCT", "ALL" full opacity, the rest dimmed 40%) — no
  // separate breadcrumb text beside it, per node 3625:108171.
  const isIndexTabs = variant === 'index' && !workTitle && !navLabel
  return (
    <div className="navbar-v2">
      <div className="navbar-v2__left">
        <Link to="/" className="nav-identity" aria-label="Home">
          {/* v6.5's mark — a plain square now (was a dot), shown alongside
              the "Eric Sin" name per node 3583:39446's updated logo
              (3633:108547/3633:108544) instead of replacing it. */}
          <svg className="nav-identity__mark" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="10" height="10" fill="currentColor" />
          </svg>
          <span className="nav-identity__name">Eric Sin</span>
          <span className="nav-identity__title">Brand &amp; Product</span>
        </Link>
      </div>

      <div className="navbar-v2__controller">
        <div className="navbar-v2__tabs">
          {workTitle ? (
            /* Case-study breadcrumb ("INDEX / {title}", node 3630:108190)
               — same reversed-emphasis LabelMono pattern as
               .nav-label--mono-crumb below (About/Archives), just with the
               work title standing in for their static label text. */
            <div className="nav-label nav-label--mono-crumb">
              <Link to="/" className="nav-label__title--link">Index</Link>
              <span className="nav-label__sep">/</span>
              <span className="nav-label__meta">{workTitle}</span>
            </div>
          ) : navLabel ? (
            /* Static (non-case-study) label, e.g. Archives' "Archived Work
               • 2013—2026" (node 3625:108152) — LabelMono now, title full
               opacity, "•" + meta dimmed 40%. */
            <div className="nav-label nav-label--mono">
              <span className="nav-label__title">{navLabel.title}</span>
              <span className="nav-label__sep">•</span>
              <span className="nav-label__meta">{navLabel.meta}</span>
            </div>
          ) : isIndexTabs && tabs ? (
            /* Index's tab row IS its LabelMono nav label now (node
               3625:108171) — "ALL" full opacity, "BRAND"/"PRODUCT" dimmed
               40%, plain text instead of the old pill Tab buttons. */
            <div className="nav-tabs-mono">
              <button
                type="button"
                className={`nav-tabs-mono__item${activeTab === null ? ' nav-tabs-mono__item--active' : ''}`}
                onClick={() => onTabChange?.(null)}
              >
                All
              </button>
              {tabs.map(({ label }) => (
                <button
                  key={label}
                  type="button"
                  className={`nav-tabs-mono__item${activeTab === label ? ' nav-tabs-mono__item--active' : ''}`}
                  onClick={() => onTabChange?.(label)}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="navbar-v2__menu-wrap">
          <button type="button" className="nav-menu-btn" onClick={onOpenPalette}>
            <span className="nav-menu-btn__label">Menu</span>
            <IconCmdk className="nav-menu-btn__icon" />
          </button>
        </div>
      </div>
    </div>
  )
}

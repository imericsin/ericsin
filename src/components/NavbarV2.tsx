import { Link } from 'react-router-dom'
import Tab from './Tab'
import MenuIcon from './MenuIcon'
import OverlayNav from './OverlayNav'

export interface TabDef {
  label: string
  count: number
}

interface Props {
  variant: 'index' | 'about-archives'
  tabs?: TabDef[]
  activeTab?: string | null
  onTabChange?: (label: string | null) => void
  menuOpen: boolean
  onMenuToggle: () => void
  overlayVisible: boolean
  onOverlayLinkClick: () => void
}

export default function NavbarV2({
  variant,
  tabs,
  activeTab = null,
  onTabChange,
  menuOpen,
  onMenuToggle,
  overlayVisible,
  onOverlayLinkClick,
}: Props) {
  return (
    <div className="navbar-v2">
      <div className="navbar-v2__left">
        <Link to="/" className="nav-identity" aria-label="Home">
          <span className="nav-identity__name">Eric Sin</span>
          <span className="nav-identity__title">Brand &amp; Product</span>
        </Link>
      </div>

      <div className="navbar-v2__controller">
        <div className="navbar-v2__tabs">
          {variant === 'index' && tabs && (
            <div className="tab-row">
              <Tab
                label="All"
                count={tabs.reduce((sum, t) => sum + t.count, 0)}
                active={activeTab === null}
                onClick={() => onTabChange?.(null)}
              />
              {tabs.map(({ label, count }) => (
                <Tab
                  key={label}
                  label={label}
                  count={count}
                  active={activeTab === label}
                  onClick={() => onTabChange?.(label)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="navbar-v2__menu-wrap">
          <MenuIcon open={menuOpen} onClick={onMenuToggle} />
          {menuOpen && (
            <OverlayNav visible={overlayVisible} desktop onLinkClick={onOverlayLinkClick} />
          )}
        </div>
      </div>
    </div>
  )
}

import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/preorders', label: 'Preorders' },
  { to: '/live', label: 'Live / Rip & Ship' },
  { to: '/policies', label: 'Policies' },
  { to: '/about', label: 'About' },
  { to: '/hours', label: 'Hours & Location' },
  { to: '/marketplace', label: 'Marketplace', badge: 'Soon' }
]

function Logo() {
  return (
    <div className="logo">
      <div className="logoMark" aria-hidden>
        <div className="logoGem g1" />
        <div className="logoGem g2" />
        <div className="logoGem g3" />
      </div>
      <div className="logoText">
        <div className="logoTitle">The Crystal Card Keep</div>
        <div className="logoSub">Mystic trading post • Buy / Sell / Trade</div>
      </div>
    </div>
  )
}

export default function SiteLayout({ children }) {
  const loc = useLocation()

  return (
    <div className="appShell">
      <div className="bgOrbs" aria-hidden>
        <div className="orb o1" />
        <div className="orb o2" />
        <div className="orb o3" />
      </div>

      <header className="topbar">
        <div className="container topbarInner">
          <Logo />

          <nav className="nav">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `navItem ${isActive ? 'active' : ''}`
                }
                end={item.to === '/'}
              >
                <span>{item.label}</span>
                {item.badge ? <span className="badge">{item.badge}</span> : null}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="routeBar" aria-hidden>
          <div className="container routeBarInner">
            <span className="crumb">{loc.pathname === '/' ? 'Home' : loc.pathname.replace('/', '').replace(/-/g, ' ')}</span>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">{children}</div>
      </main>

      <footer className="footer">
        <div className="container footerInner">
          <div>
            <div className="footerTitle">The Crystal Card Keep</div>
            <div className="footerText">
              Store-first build for distributor credibility. Marketplace launching after inventory + category foundation.
            </div>
          </div>
          <div className="footerLinks">
            <a className="footerLink" href="#/inventory">Inventory</a>
            <a className="footerLink" href="#/live">Live / Rip & Ship</a>
            <a className="footerLink" href="#/policies">Policies</a>
            <a className="footerLink" href="#/about">About</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import "./App.css";
import Contact from "./pages/Contact.jsx";
import Affiliates from "./pages/Affiliates.jsx";
import Shop from "./pages/Shop.jsx";
import Live from "./pages/Live.jsx";

export default function App() {
  // Background layers (make sure these exist in /public/img)
  const bgBack = "/img/crystal-card-keep-bc-back.png";
  const bgFront = "/img/crystal-card-keep-bc-front.png";

  // Featured card image
  const featuredCard = "/img/crystal-card-keep-bc-front.png";

  function SiteHeader() {
    return (
      <header className="siteHeader">
        <div className="wrap navBar">
          <Link className="brand" to="/" aria-label="The Crystal Card Keep">
            <span className="sigil" aria-hidden="true" />
            <span className="brandText">
              <span className="brandName">THE CRYSTAL CARD KEEP</span>
              <span className="brandTag">Buy • Sell • Trade</span>
            </span>
          </Link>

          <nav className="navLinks" aria-label="Primary navigation">
            <Link to="/shop">Shop</Link>
            <Link to="/live">Live</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/affiliates">Affiliates</Link>
          </nav>

          {/* Intentionally removed: redundant header action bubbles (Sell to us / Shop) */}
        </div>
      </header>
    );
  }

  function Home() {
    return (
      <div className="appRoot">
        <div className="gridOverlay" aria-hidden="true" />

        <SiteHeader />

        <main className="main">
          <div className="wrap">
            <section className="hero" aria-label="Landing">
              <div
                className="heroBg heroBgBack"
                style={{ backgroundImage: `url(${bgBack})` }}
                aria-hidden="true"
              />
              <div
                className="heroBg heroBgFront"
                style={{ backgroundImage: `url(${bgFront})` }}
                aria-hidden="true"
              />

              <div className="heroInner">
                <div className="heroLeft">
                  <h1 className="heroTitle">The Crystal Card Keep</h1>
                  <p className="heroSubline">BUY • SELL • TRADE</p>

                  <div className="searchRow">
                    <form
                      className="search"
                      role="search"
                      aria-label="Search the site"
                      onSubmit={(e) => e.preventDefault()}
                    >
                      <span className="ico" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path
                            d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                          <path
                            d="M16.5 16.5 21 21"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <input
                        name="q"
                        type="search"
                        placeholder="Search singles, sealed, sets, character…"
                        autoComplete="off"
                      />
                    </form>

                    <span className="pill">Pokémon</span>
                    <span className="pill">One Piece</span>
                    <span className="pill">MTG</span>
                  </div>

                  <div className="ctaRow">
                    <Link className="btn primary" to="/shop">
                      Browse inventory
                    </Link>
                    <Link className="btn" to="/live">
                      Watch live
                    </Link>
                  </div>
                </div>

                <aside className="heroRight" aria-label="Featured card">
                  <div
                    className="cardFrameLegacy"
                    role="img"
                    aria-label="Crystal Card Keep featured card"
                  >
                    <div className="cardStageLegacy">
                      <img
                        className="cardImgLegacy"
                        src={featuredCard}
                        alt="The Crystal Card Keep card"
                      />
                      <div className="cardShineLegacy" aria-hidden="true" />
                      <div className="cardEdgeLegacy" aria-hidden="true" />
                    </div>
                  </div>
                </aside>
              </div>
            </section>

            <footer className="footer">
              <div className="wrap foot">
                <small>© {new Date().getFullYear()} The Crystal Card Keep</small>
                <small>Rolla / Saint James, MO • Live auctions • Singles • Sealed</small>
              </div>
            </footer>
          </div>
        </main>
      </div>
    );
  }

  function NotFound() {
    return (
      <div className="appRoot">
        <div className="gridOverlay" aria-hidden="true" />
        <SiteHeader />
        <main className="main">
          <div className="wrap">
            <section className="hero heroCardStandard" aria-label="Page not found">
              <div className="heroInner">
                <div className="heroLeft">
                  <h1 className="heroTitle">Page Not Found</h1>
                  <p className="heroSubline">
                    This destination is not currently available.
                  </p>
                  <div className="ctaRow">
                    <Link className="btn primary" to="/">
                      Return home
                    </Link>
                    <Link className="btn" to="/shop">
                      Visit shop
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/contact"
        element={
          <div className="appRoot">
            <div className="gridOverlay" aria-hidden="true" />
            <SiteHeader />
            <main className="main">
              <div className="wrap">
                <Contact />
              </div>
            </main>
          </div>
        }
      />
      <Route
        path="/affiliates"
        element={
          <div className="appRoot">
            <div className="gridOverlay" aria-hidden="true" />
            <SiteHeader />
            <main className="main">
              <div className="wrap">
                <Affiliates />
              </div>
            </main>
          </div>
        }
      />
      <Route
        path="/shop"
        element={
          <div className="appRoot">
            <div className="gridOverlay" aria-hidden="true" />
            <SiteHeader />
            <main className="main">
              <div className="wrap">
                <Shop />
              </div>
            </main>
          </div>
        }
      />
      <Route
        path="/live"
        element={
          <div className="appRoot">
            <div className="gridOverlay" aria-hidden="true" />
            <SiteHeader />
            <main className="main">
              <div className="wrap">
                <Live />
              </div>
            </main>
          </div>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}



import "./App.css";

export default function App() {
  const bgBack = "/img/crystal-card-keep-bc-back.png";
  const bgFront = "/img/crystal-card-keep-bc-front.png";

  return (
    <div className="appRoot">
      <div className="gridOverlay" aria-hidden="true" />

      <header className="siteHeader">
        <div className="wrap navBar">
          <a className="brand" href="/" aria-label="The Crystal Card Keep">
            <span className="sigil" aria-hidden="true" />
            <span className="brandText">
              <span className="brandName">THE CRYSTAL CARD KEEP</span>
              <span className="brandTag">Buy • Sell • Trade</span>
            </span>
          </a>

          <nav className="navLinks" aria-label="Primary navigation">
            <a href="/shop">Shop</a>
            <a href="/sell">Sell</a>
            <a href="/trade">Trade</a>
            <a href="/live">Live</a>
            <a href="/contact">Contact</a>
          </nav>

          <div className="navActions">
            <a className="btn" href="/sell">
              Sell to us
            </a>
            <a className="btn primary" href="/shop">
              Shop
            </a>
          </div>
        </div>
      </header>

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
                <p className="heroSubline">Buy • Sell • Trade</p>

                <p className="heroTagline">
                  Clean listings, fast shipping, and live auctions that don’t
                  feel like a circus.
                  <br />
                  Search singles and sealed across Pokémon, One Piece, and more.
                </p>

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
                  <a className="btn primary" href="/shop">
                    Browse inventory
                  </a>
                  <a className="btn" href="/live">
                    Watch live
                  </a>
                  <a className="btn" href="/trade">
                    Trade options
                  </a>
                  <a className="btn" href="/sell">
                    Sell to us
                  </a>
                </div>

                <div className="quickRow">
                  <a className="quick" href="/shop/pokemon">
                    <div>
                      <b>Pokémon</b>
                      <span>Sealed + singles</span>
                    </div>
                    <div className="arrow" aria-hidden="true">
                      <span className="ico">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path
                            d="M9 6l6 6-6 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                  </a>

                  <a className="quick" href="/shop/one-piece">
                    <div>
                      <b>One Piece</b>
                      <span>Hard-to-find drops</span>
                    </div>
                    <div className="arrow" aria-hidden="true">
                      <span className="ico">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path
                            d="M9 6l6 6-6 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                  </a>

                  <a className="quick" href="/shop/singles">
                    <div>
                      <b>Singles</b>
                      <span>Chase + staples</span>
                    </div>
                    <div className="arrow" aria-hidden="true">
                      <span className="ico">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path
                            d="M9 6l6 6-6 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                  </a>
                </div>
              </div>

              <aside className="heroRight" aria-label="Featured card art">
                <div className="cardMeta">
                  <div className="cardTitleRow">
                    <h4>Featured card art</h4>
                  </div>
                </div>

                <div
                  className="cardFrame"
                  role="img"
                  aria-label="Crystal Card Keep featured art"
                >
                  <img src={bgFront} alt="Crystal Card Keep card art" />
                </div>
              </aside>
            </div>
          </section>

          <footer className="footer">
            <div className="wrap foot">
              <small>
                © {new Date().getFullYear()} The Crystal Card Keep
              </small>
              <small>Rolla / Saint James, MO • Live auctions • Singles • Sealed</small>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

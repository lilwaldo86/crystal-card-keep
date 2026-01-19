import "./App.css";

export default function App() {
  return (
    <>
      <div className="grid" aria-hidden="true"></div>

      <header>
        <div className="wrap">
          <div className="nav">
            <a className="brand" href="/" aria-label="The Crystal Card Keep">
              <span className="sigil" aria-hidden="true"></span>
              <span style={{ display: "grid", gap: 2 }}>
                <span
                  style={{
                    fontSize: 13,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,.88)",
                  }}
                >
                  The Crystal Card Keep
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.55)" }}>
                  Buy • Sell • Trade
                </span>
              </span>
            </a>

            <nav className="navlinks" aria-label="Primary navigation">
              <a href="/shop">Shop</a>
              <a href="/sell">Sell</a>
              <a href="/trade">Trade</a>
              <a href="/live">Live</a>
              <a href="/contact">Contact</a>
            </nav>

            <div className="actions">
              <a className="btn" href="/sell">
                Sell to us
              </a>
              <a className="btn primary" href="/shop">
                Shop
              </a>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="wrap">
          <section className="hero" aria-label="Landing">
            <div className="heroInner heroGrid">
              <div>
                <h1 className="name">The Crystal Card Keep</h1>
                <p className="subline">Buy • Sell • Trade</p>

                <p className="tagline">
                  Clean listings, fast shipping, and live auctions that don’t feel like a circus. Search singles and sealed
                  across Pokémon, One Piece, and more.
                </p>

                <div className="searchWrap">
                  <form
                    className="search"
                    role="search"
                    onSubmit={(e) => {
                      e.preventDefault();
                    }}
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
                      type="search"
                      placeholder="Search singles, sealed, sets, characters…"
                      autoComplete="off"
                    />
                  </form>

                  <span className="pill">Pokémon</span>
                  <span className="pill">One Piece</span>
                  <span className="pill">MTG</span>
                </div>

                <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 10 }}>
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

                <div className="quickRow" style={{ marginTop: 18 }}>
                  <a className="quick" href="/shop/pokemon">
                    <div>
                      <b>Pokémon</b>
                      <span>Sealed + singles</span>
                    </div>
                    <div className="arrow">
                      <span className="ico">›</span>
                    </div>
                  </a>

                  <a className="quick" href="/shop/one-piece">
                    <div>
                      <b>One Piece</b>
                      <span>Hard-to-find drops</span>
                    </div>
                    <div className="arrow">
                      <span className="ico">›</span>
                    </div>
                  </a>

                  <a className="quick" href="/shop/singles">
                    <div>
                      <b>Singles</b>
                      <span>Chase + staples</span>
                    </div>
                    <div className="arrow">
                      <span className="ico">›</span>
                    </div>
                  </a>
                </div>
              </div>

              <div className="heroArt" aria-hidden="true">
                <div className="cardStack">
                  <img
                    className="card back"
                    src="/img/crystal-card-keep-bc-back.png"
                    alt=""
                  />
                  <img
                    className="card front"
                    src="/img/crystal-card-keep-bc-front.png"
                    alt=""
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer>
        <div className="wrap">
          <div className="foot">
            <small>© {new Date().getFullYear()} The Crystal Card Keep</small>
            <div style={{ display: "flex", gap: 10 }}>
              <a className="btn" href="/policies">Policies</a>
              <a className="btn" href="/shipping">Shipping</a>
              <a className="btn" href="/contact">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

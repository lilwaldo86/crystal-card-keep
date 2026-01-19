import React from "react";

export default function App() {
  // IMPORTANT:
  // These paths are for Cloudflare Pages + Vite "public" folder assets.
  // The files must end up at dist/img/... after build.
  const frontImg = "/img/crystal-card-keep-bc-front.png";
  const backImg = "/img/crystal-card-keep-bc-back.png";

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% 20%, rgba(124,58,237,0.28), transparent 60%), radial-gradient(1200px 600px at 80% 30%, rgba(20,184,166,0.22), transparent 60%), #07090f",
        color: "rgba(255,255,255,0.92)",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
      }}
    >
      {/* Top nav */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(10px)",
          background: "rgba(7,9,15,0.55)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                background:
                  "linear-gradient(135deg, rgba(124,58,237,1), rgba(20,184,166,1))",
                boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
              }}
            />
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: 12, letterSpacing: 1.4, opacity: 0.85 }}>
                THE CRYSTAL CARD KEEP
              </div>
              <div style={{ fontSize: 11, opacity: 0.65 }}>Buy • Sell • Trade</div>
            </div>
          </div>

          <nav style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {["Shop", "Sell", "Trade", "Live", "Contact"].map((label) => (
              <a
                key={label}
                href="#"
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.70)",
                  textDecoration: "none",
                }}
              >
                {label}
              </a>
            ))}
            <button
              style={{
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.88)",
                padding: "10px 12px",
                borderRadius: 12,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Sell to us
            </button>
            <button
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
                color: "rgba(255,255,255,0.92)",
                padding: "10px 12px",
                borderRadius: 12,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Shop
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "42px 18px" }}>
        <section
          style={{
            position: "relative",
            borderRadius: 28,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.05)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
          }}
        >
          {/* Image layer */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.35,
              pointerEvents: "none",
              backgroundImage: `url("${backImg}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "saturate(1.1) contrast(1.05)",
            }}
          />

          {/* Overlay gradient to keep text readable */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(7,9,15,0.90) 0%, rgba(7,9,15,0.55) 55%, rgba(7,9,15,0.25) 100%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              padding: 34,
              display: "grid",
              gridTemplateColumns: "1.15fr 0.85fr",
              gap: 22,
              alignItems: "center",
            }}
          >
            {/* Left */}
            <div>
              <h1 style={{ margin: 0, fontSize: 46, letterSpacing: -0.6 }}>
                The Crystal Card Keep
              </h1>
              <div style={{ marginTop: 8, opacity: 0.75, fontSize: 14 }}>
                Buy • Sell • Trade
              </div>
              <p style={{ marginTop: 18, maxWidth: 520, opacity: 0.8, lineHeight: 1.5 }}>
                Clean listings, fast shipping, and live auctions that don’t feel like a circus.
                Search singles and sealed across Pokémon, One Piece, and more.
              </p>

              {/* Search row */}
              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(7,9,15,0.45)",
                    minWidth: 300,
                  }}
                >
                  <span style={{ opacity: 0.55 }}>🔎</span>
                  <input
                    placeholder="Search singles, sealed, sets, character"
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "rgba(255,255,255,0.9)",
                      fontSize: 13,
                    }}
                  />
                </div>

                {["Pokémon", "One Piece", "MTG"].map((t) => (
                  <button
                    key={t}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.86)",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* CTA row */}
              <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.16)",
                    background:
                      "linear-gradient(135deg, rgba(250,204,21,0.15), rgba(255,255,255,0.06))",
                    color: "rgba(255,255,255,0.92)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Browse inventory
                </button>
                <button
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.90)",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Watch live
                </button>
                <button
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.90)",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Trade options
                </button>
                <button
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.90)",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Sell to us
                </button>
              </div>

              {/* Category cards */}
              <div
                style={{
                  marginTop: 18,
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
                {[
                  { title: "Pokémon", sub: "Sealed + singles" },
                  { title: "One Piece", sub: "Hard-to-find drops" },
                  { title: "Singles", sub: "Chase + staples" },
                ].map((c) => (
                  <div
                    key={c.title}
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(7,9,15,0.35)",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.title}</div>
                    <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>{c.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 340,
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 360,
                  borderRadius: 22,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(7,9,15,0.40)",
                  overflow: "hidden",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
                }}
              >
                <div
                  style={{
                    padding: 14,
                    borderBottom: "1px solid rgba(255,255,255,0.10)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 600 }}>
                    Featured card art
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>static asset test</div>
                </div>

                <div style={{ padding: 14 }}>
                  <div
                    style={{
                      aspectRatio: "4 / 3",
                      width: "100%",
                      borderRadius: 18,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.04)",
                      position: "relative",
                    }}
                  >
                    <img
                      src={frontImg}
                      alt="Crystal Card Keep - front"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                      onError={(e) => {
                        // If the image 404s, show a visible hint instead of silently failing.
                        e.currentTarget.style.display = "none";
                        const box = e.currentTarget.parentElement;
                        if (box) {
                          box.style.display = "flex";
                          box.style.alignItems = "center";
                          box.style.justifyContent = "center";
                          box.style.padding = "16px";
                          box.style.color = "rgba(255,255,255,0.75)";
                          box.style.fontSize = "12px";
                          box.innerText =
                            "Image failed to load. If you're on Cloudflare, your folder must be named 'public' (lowercase) so the build copies /img into dist.";
                        }
                      }}
                    />
                  </div>

                  <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75, lineHeight: 1.4 }}>
                    Expected URL:
                    <div style={{ marginTop: 6, opacity: 0.95, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>
                      {frontImg}
                    </div>
                    <div style={{ marginTop: 8, opacity: 0.7 }}>
                      If that URL redirects to the homepage, Cloudflare is serving SPA fallback because the file didn’t land in <b>dist/img</b> at deploy time.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer spacer */}
        <div style={{ height: 28 }} />
      </main>
    </div>
  );
}

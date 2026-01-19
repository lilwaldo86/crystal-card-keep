import React from "react";

/**
 * IMPORTANT:
 * These images are served directly from Cloudflare Pages:
 * https://crystal-card-keep.pages.dev/img/...
 * Do NOT import them via JS bundling.
 */
const FRONT_CARD = "/img/crystal-card-keep-bc-front.png";
const BACK_CARD = "/img/crystal-card-keep-bc-back.png";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05060a] via-[#0b1020] to-[#0a1a1f] text-white">
      {/* NAV */}
      <header className="flex items-center justify-between px-10 py-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400" />
          <div>
            <div className="font-semibold tracking-wide">
              THE CRYSTAL CARD KEEP
            </div>
            <div className="text-xs text-gray-400">Buy · Sell · Trade</div>
          </div>
        </div>

        <nav className="flex items-center gap-6 text-sm text-gray-300">
          <a href="#">Shop</a>
          <a href="#">Sell</a>
          <a href="#">Trade</a>
          <a href="#">Live</a>
          <a href="#">Contact</a>
          <button className="rounded-full bg-white/10 px-4 py-2 hover:bg-white/20">
            Sell to us
          </button>
          <button className="rounded-full bg-gradient-to-r from-amber-400 to-amber-300 px-4 py-2 text-black font-medium">
            Shop
          </button>
        </nav>
      </header>

      {/* HERO */}
      <main className="mx-auto max-w-7xl px-10 pt-16">
        <div className="relative rounded-3xl bg-white/5 backdrop-blur-xl p-12 overflow-hidden">
          {/* BACKGROUND CARD (SUBTLE) */}
          <img
            src={BACK_CARD}
            alt="Crystal Card Back"
            className="absolute -right-40 -top-40 w-[900px] opacity-20 blur-sm pointer-events-none"
          />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* LEFT */}
            <div>
              <h1 className="text-5xl font-semibold mb-4">
                The Crystal Card Keep
              </h1>
              <p className="text-gray-300 mb-6 max-w-xl">
                Clean listings, fast shipping, and live auctions that don’t feel
                like a circus. Search singles and sealed across Pokémon, One
                Piece, and more.
              </p>

              <div className="flex gap-3 mb-6">
                <input
                  className="flex-1 rounded-full bg-white/10 px-5 py-3 text-sm outline-none"
                  placeholder="Search singles, sealed, sets, character"
                />
                <button className="rounded-full bg-white/10 px-4 py-3">
                  Pokémon
                </button>
                <button className="rounded-full bg-white/10 px-4 py-3">
                  One Piece
                </button>
                <button className="rounded-full bg-white/10 px-4 py-3">
                  MTG
                </button>
              </div>

              <div className="flex gap-4 mb-8">
                <button className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 px-6 py-3 text-black font-medium">
                  Browse inventory
                </button>
                <button className="rounded-xl bg-white/10 px-6 py-3">
                  Watch live
                </button>
                <button className="rounded-xl bg-white/10 px-6 py-3">
                  Trade options
                </button>
                <button className="rounded-xl bg-white/10 px-6 py-3">
                  Sell to us
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="rounded-xl bg-white/10 p-4">
                  <div className="font-medium">Pokémon</div>
                  <div className="text-gray-400 text-xs">Sealed + singles</div>
                </div>
                <div className="rounded-xl bg-white/10 p-4">
                  <div className="font-medium">One Piece</div>
                  <div className="text-gray-400 text-xs">
                    Hard-to-find drops
                  </div>
                </div>
                <div className="rounded-xl bg-white/10 p-4">
                  <div className="font-medium">Singles</div>
                  <div className="text-gray-400 text-xs">Chase + staples</div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="relative flex items-center justify-center">
              <img
                src={FRONT_CARD}
                alt="Crystal Card Front"
                className="w-[420px] rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

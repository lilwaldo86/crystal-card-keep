import { useMemo, useState } from "react";
import TradingCard from "./TradingCard.jsx";
import SubcategoryCards from "./SubcategoryCards.jsx";
import LoadingAvatar from "./LoadingAvatar.jsx";

const GAME_TABS = [
  { key: "pokemon", label: "Pokémon", href: "#pokemon" },
  { key: "onepiece", label: "One Piece", href: "#onepiece" },
  { key: "singles", label: "Singles", href: "#singles" },
];

export default function Hero() {
  const [activeGame, setActiveGame] = useState("pokemon");
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const activeHref = useMemo(() => {
    const found = GAME_TABS.find((g) => g.key === activeGame);
    return found ? found.href : "#";
  }, [activeGame]);

  function onSubmit(e) {
    e.preventDefault();

    // Temporary "thinking" state for polish. Replace with real search later.
    if (isSearching) return;
    setIsSearching(true);
    window.setTimeout(() => setIsSearching(false), 900);
  }

  return (
    <main className="hero">
      <div className="hero__inner">
        <section className="hero__grid" aria-label="Crystal Card Keep landing hero">
          <div className="hero__left">
            <div className="hero__headline">
              <h1 className="hero__title">The Crystal Card Keep</h1>
              <p className="hero__subline">Buy • Sell • Trade</p>
            </div>

            {/* Intentionally: no extra hero text above the search bar */}
            <form className="hero__search" role="search" aria-label="Search cards" onSubmit={onSubmit}>
              <div className="search">
                <span className="search__icon" aria-hidden="true">
                  🔎
                </span>

                <label className="sr-only" htmlFor="card-search">
                  Search
                </label>

                <input
                  id="card-search"
                  className="search__input"
                  type="search"
                  placeholder="Search singles, sealed, sets, characters…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete="off"
                  spellCheck="false"
                  enterKeyHint="search"
                />

                <button className="search__btn" type="submit" aria-label="Search">
                  {isSearching ? (
                    <span className="search__loading" aria-label="Searching">
                      <LoadingAvatar game={activeGame} size={18} />
                    </span>
                  ) : (
                    "Search"
                  )}
                </button>
              </div>
            </form>

            <div className="gameChips" aria-label="Game selection">
              {GAME_TABS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  className={`chip ${activeGame === g.key ? "chip--active" : ""}`}
                  onClick={() => setActiveGame(g.key)}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <SubcategoryCards />
          </div>

          <aside className="hero__right" aria-label="Showcase trading card">
            <div className="cardFrame">
              <TradingCard href={activeHref} game={activeGame} />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

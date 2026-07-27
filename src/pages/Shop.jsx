import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const TABS = [
  { key: "pokemon", label: "Pokémon" },
  { key: "onepiece", label: "One Piece" },
  { key: "mtg", label: "MTG" },
  { key: "other", label: "Other TCGs" },
];

const DATA = {
  pokemon: {
    header: "Pokémon",
    sets: [
      { code: "MEGA", name: "Perfect Order" },
      { code: "MEGA", name: "Ascended Heroes" },
      { code: "MEGA", name: "Phantasmal Flames" },
    ],
  },
  onepiece: {
    header: "One Piece",
    sets: [
      { code: "EB03", name: "One Piece Heroines Edition" },
      { code: "OP14", name: "The Azure Sea's Seven" },
      { code: "OP13", name: "Carrying On His Will" },
    ],
  },
  mtg: {
    header: "Magic: The Gathering",
    sets: [
      { code: "MTG", name: "TMNT" },
      { code: "MTG", name: "Lorwyn Eclipsed" },
      { code: "MTG", name: "Avatar: The Last Airbender" },
    ],
  },
  other: {
    header: "Other TCGs",
    sets: [],
  },
};

function normalizeSearch(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export default function Shop({ game = null }) {
  const [activeTab, setActiveTab] = useState("pokemon");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeKey = useMemo(() => game || activeTab, [game, activeTab]);
  const searchQuery = (searchParams.get("q") || "").trim();
  const normalizedQuery = normalizeSearch(searchQuery);

  const visibleData = useMemo(() => {
    const entries = game && DATA[game]
      ? [[game, DATA[game]]]
      : Object.entries(DATA);
    if (!normalizedQuery) return entries;

    return entries
      .map(([key, column]) => [
        key,
        {
          ...column,
          sets: column.sets.filter((set) =>
            normalizeSearch(`${column.header} ${set.code} ${set.name}`)
              .includes(normalizedQuery)
          ),
        },
      ])
      .filter(([, column]) => column.sets.length > 0);
  }, [game, normalizedQuery]);

  function selectGame(key) {
    setActiveTab(key);

    if (key === "pokemon") navigate("/shop/pokemon");
    else if (key === "onepiece") navigate("/shop/one-piece");
    else if (key === "mtg") navigate("/shop/mtg");
    else navigate("/shop");
  }

  return (
    <section className="hero shopHero heroCardStandard">
      {/* Home-style blurred art layer (this is what Shop was missing) */}
      <div
        className="heroBg"
        aria-hidden="true"
        style={{ backgroundImage: "url('/img/hero-card-art.jpg')" }}
      />

      {/* Business-card watermark layers (global block applies) */}
      <div className="heroBg shopArtBg" aria-hidden="true" />
      <div className="heroBgBack" aria-hidden="true" />
      <div className="heroBgFront" aria-hidden="true" />

      <div className="heroInner shopHeroInner">
        <header className="shopHeader">
          <h1 className="heroTitle shopTitle">Shop</h1>
          <p className="heroSubline shopTagline">
            Fresh drops, clean pulls, and zero nonsense—pick a lane and we’ll keep the heat coming.
          </p>

          <div className="shopTabs" role="tablist" aria-label="Shop categories">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={"shopTab pillBtn" + (activeKey === tab.key ? " isActive" : "")}
                onClick={() => selectGame(tab.key)}
                role="tab"
                aria-selected={activeKey === tab.key}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {searchQuery ? (
          <p className="shopComingSoon" role="status">
            {visibleData.length > 0
              ? `Showing current sets matching “${searchQuery}”.`
              : `No current sets match “${searchQuery}”.`}
          </p>
        ) : null}

        {visibleData.length > 0 ? (
          <div className="shopGrid">
            {visibleData.map(([key, column]) => {
              const isActive = activeKey === key;
              return (
                <section key={key} className={"shopCol" + (isActive ? " isActive" : "")}>
                  <div className="shopColHeader">
                    <button
                      type="button"
                      className="pillBtn pillHeader shopColTitle"
                      onClick={() => selectGame(key)}
                      aria-pressed={isActive}
                    >
                      {column.header}
                    </button>
                  </div>

                  {key === "other" ? (
                    <div className="shopComingSoonWrap">
                      <p className="shopComingSoon">Coming soon…</p>
                    </div>
                  ) : (
                    <div className="shopSetPills">
                      {column.sets.map((set) => (
                        <div
                          key={set.code + set.name}
                          className="shopSetPill"
                          title={`${column.header}: ${set.code} — ${set.name}`}
                        >
                          <span className="shopSetMeta">{set.code}</span>
                          <span className="shopSetName">{set.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="shopComingSoonWrap" aria-live="polite">
            <p className="shopComingSoon">Try another current set name or code.</p>
          </div>
        )}
      </div>
    </section>
  );
}

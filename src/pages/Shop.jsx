import React, { useMemo, useState } from "react";

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

export default function Shop() {
  const [activeTab, setActiveTab] = useState("pokemon");
  const activeKey = useMemo(() => activeTab, [activeTab]);

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
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={"shopTab pillBtn" + (activeKey === t.key ? " isActive" : "")}
                onClick={() => setActiveTab(t.key)}
                role="tab"
                aria-selected={activeKey === t.key}
              >
                {t.label}
              </button>
            ))}
          </div>
        </header>

        <div className="shopGrid">
          {Object.entries(DATA).map(([key, col]) => {
            const isActive = activeKey === key;
            return (
              <section key={key} className={"shopCol" + (isActive ? " isActive" : "")}>
                <div className="shopColHeader">
                  <button
                    type="button"
                    className="pillBtn pillHeader shopColTitle"
                    onClick={() => setActiveTab(key)}
                    aria-pressed={isActive}
                  >
                    {col.header}
                  </button>
                </div>

                {key === "other" ? (
                  <div className="shopComingSoonWrap">
                    <p className="shopComingSoon">Coming soon…</p>
                  </div>
                ) : (
                  <div className="shopSetPills">
                    {col.sets.map((s) => (
                      <a
                        key={s.code + s.name}
                        className="shopSetPill"
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        title={`${col.header}: ${s.code} — ${s.name}`}
                      >
                        <span className="shopSetMeta">{s.code}</span>
                        <span className="shopSetName">{s.name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}


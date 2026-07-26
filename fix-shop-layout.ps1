$ErrorActionPreference="Stop"

$shopPath = ".\src\pages\Shop.jsx"
$cssPath  = ".\src\App.css"

if(!(Test-Path $shopPath)){ throw "Missing $shopPath" }
if(!(Test-Path $cssPath)){ throw "Missing $cssPath" }

Copy-Item $shopPath "$shopPath.bak_auto_shoplayout" -Force
Copy-Item $cssPath  "$cssPath.bak_auto_shoplayout" -Force

# =========================
# OVERWRITE Shop.jsx (no regex, no guessing)
# =========================
$shopContent = @"
import React, { useMemo } from "react";
import { SHOP_CATALOG } from "../data/shopCatalog.js";

function sortNewest(sets = []) {
  const out = (sets || []).slice();
  out.sort((a, b) => (b.releaseDate || "").localeCompare(a.releaseDate || ""));
  return out;
}

/** Prefer specific keys (slug/name includes), then fill with newest until count. */
function pickFeatured(sets, preferredKeys = [], fillCount = 3) {
  const newest = sortNewest(sets);
  const used = new Set();
  const picked = [];
  const norm = (s) => (s || "").toLowerCase();

  for (const key of preferredKeys) {
    const k = norm(key);
    const match =
      newest.find((x) => norm(x.setSlug).includes(k)) ||
      newest.find((x) => norm(x.name).includes(k));
    if (match && !used.has(match.setSlug)) {
      picked.push(match);
      used.add(match.setSlug);
    }
  }

  for (const s of newest) {
    if (picked.length >= fillCount) break;
    if (!used.has(s.setSlug)) {
      picked.push(s);
      used.add(s.setSlug);
    }
  }

  return picked.slice(0, fillCount);
}

function labelShort(tcgKey, name = "", setSlug = "") {
  const n = (name || "").trim();
  const slug = (setSlug || "").toUpperCase();

  if (tcgKey === "pokemon") {
    return n
      .replace(/^Mega\s*Evolution[—-]\s*/i, "Mega: ")
      .replace(/^Scarlet\s*&\s*Violet[—-]\s*/i, "")
      .replace(/^Sword\s*&\s*Shield[—-]\s*/i, "SWSH: ");
  }

  if (tcgKey === "onepiece") {
    const m = slug.match(/\b(EB\d{2}|OP\d{2})\b/);
    if (m) return m[1];
    return n;
  }

  if (tcgKey === "mtg") {
    if (/teenage mutant ninja turtles/i.test(n)) return "TMNT";
    if (/lorwyn/i.test(n)) return "Lorwyn Eclipsed";
    if (/avatar/i.test(n)) return "Avatar: The Last Airbender";
    return n;
  }

  return n;
}

export default function Shop() {
  const bgBack = "/img/crystal-card-keep-bc-back.png";
  const bgFront = "/img/crystal-card-keep-bc-front.png";

  const pokemonSets = SHOP_CATALOG?.pokemon?.sets || [];
  const onePieceSets = SHOP_CATALOG?.onepiece?.sets || [];
  const mtgSets = SHOP_CATALOG?.mtg?.sets || [];

  // Your exact targets, with safe fallback to newest if any are missing
  const featuredPokemon = useMemo(
    () => pickFeatured(pokemonSets, ["perfect order", "ascended heroes", "phantasmal flames"], 3),
    [pokemonSets]
  );
  const featuredOnePiece = useMemo(
    () => pickFeatured(onePieceSets, ["eb03", "op14", "op13"], 3),
    [onePieceSets]
  );
  const featuredMtg = useMemo(
    () => pickFeatured(mtgSets, ["tmnt", "lorwyn eclipsed", "avatar the last air bender"], 3),
    [mtgSets]
  );

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="hero shopHero heroCardStandard" aria-label="Shop">
      <div className="heroBg heroBgBack" style={{ backgroundImage: `url(${bgBack})` }} aria-hidden="true" />
      <div className="heroBg heroBgFront" style={{ backgroundImage: `url(${bgFront})` }} aria-hidden="true" />

      <div className="heroInner">
        {/* CENTERED HEADER */}
        <div className="shopHeaderCenter">
          <h1 className="heroTitle">Shop</h1>
          <p className="heroSubline">
            Restocks. Heat checks. Real inventory. Pick a lane and snag what’s live.
          </p>
        </div>

        {/* MAIN TCG TABS UNDER HEADER (LEFT-ALIGNED) */}
        <div className="shopTabs" role="tablist" aria-label="TCG quick jump">
          <button className="pillBtn" type="button" onClick={() => scrollTo("sec-pokemon")}>Pokémon</button>
          <button className="pillBtn" type="button" onClick={() => scrollTo("sec-onepiece")}>One Piece</button>
          <button className="pillBtn" type="button" onClick={() => scrollTo("sec-mtg")}>MTG</button>
          <button className="pillBtn" type="button" onClick={() => scrollTo("sec-other")}>Other TCGs</button>
        </div>

        {/* SECTIONS STACKED UNDER TABS (NOT JAMMED ON RIGHT) */}
        <div className="shopQuickPicks" role="region" aria-label="Current hot sets">
          <section className="shopPickBlock" id="sec-pokemon" aria-label="Pokémon featured sets">
            <button className="pillBtn pillHeader" type="button" onClick={() => scrollTo("sec-pokemon")}>Pokémon</button>
            <div className="shopPickRow" role="list">
              {featuredPokemon.map((s) => (
                <button
                  key={s.setSlug}
                  className="pillBtn"
                  type="button"
                  title={s.name}
                  onClick={() => console.log("Selected Pokémon set:", s.setSlug)}
                >
                  {labelShort("pokemon", s.name, s.setSlug)}
                </button>
              ))}
            </div>
          </section>

          <section className="shopPickBlock" id="sec-onepiece" aria-label="One Piece featured sets">
            <button className="pillBtn pillHeader" type="button" onClick={() => scrollTo("sec-onepiece")}>One Piece</button>
            <div className="shopPickRow" role="list">
              {featuredOnePiece.map((s) => (
                <button
                  key={s.setSlug}
                  className="pillBtn"
                  type="button"
                  title={s.name}
                  onClick={() => console.log("Selected One Piece set:", s.setSlug)}
                >
                  {labelShort("onepiece", s.name, s.setSlug)}
                </button>
              ))}
            </div>
          </section>

          <section className="shopPickBlock" id="sec-mtg" aria-label="MTG featured sets">
            <button className="pillBtn pillHeader" type="button" onClick={() => scrollTo("sec-mtg")}>MTG</button>
            <div className="shopPickRow" role="list">
              {featuredMtg.map((s) => (
                <button
                  key={s.setSlug}
                  className="pillBtn"
                  type="button"
                  title={s.name}
                  onClick={() => console.log("Selected MTG set:", s.setSlug)}
                >
                  {labelShort("mtg", s.name, s.setSlug)}
                </button>
              ))}
            </div>
          </section>

          <section className="shopPickBlock" id="sec-other" aria-label="Other TCGs">
            <button className="pillBtn pillHeader" type="button" onClick={() => scrollTo("sec-other")}>Other TCGs</button>
            <div className="shopPickHint">
              Coming soon — we’ll surface the top 3 once inventory lands.
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
"@

Set-Content -Path $shopPath -Value $shopContent -Encoding UTF8

# =========================
# APPEND CSS OVERRIDES (wins even if earlier blocks exist)
# =========================
$marker = "/* CKK_SHOP_LAYOUT_STACKED_V3 */"
if($css -notmatch [regex]::Escape($marker)){
  $append = @"

$marker
/* Make Shop hero a single-column stack, centered title, tabs under header */
.shopHero .heroInner{
  grid-template-columns: 1fr !important;
  padding-top: 10px !important;  /* move it up more */
  gap: 14px;
}

/* Center Shop title + subline */
.shopHero .shopHeaderCenter{
  text-align: center;
  margin-top: -6px; /* nudge up */
}
.shopHero .heroTitle{
  margin: 0 0 6px !important;
}
.shopHero .heroSubline{
  margin: 0 0 10px !important;
}

/* Tabs under header, starting on the left */
.shopHero .shopTabs{
  width: 100%;
  justify-content: flex-start !important;
  margin-top: 2px;
}

/* Sections */
.shopHero .shopQuickPicks{
  display: grid;
  gap: 14px;
  margin-top: 4px;
}

/* Section blocks (soft card within watermark card) */
.shopHero .shopPickBlock{
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.16);
  border-radius: 16px;
  padding: 14px;
  backdrop-filter: blur(6px);
}

/* Row of set pills */
.shopHero .shopPickRow{
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

/* Pill section header button: clickable, but behaves like a header */
.shopHero .pillBtn.pillHeader{
  font-weight: 900;
  letter-spacing: 0.25px;
  opacity: 0.98;
}

/* Hint text */
.shopHero .shopPickHint{
  color: rgba(255,255,255,0.70);
  margin-top: 10px;
}

/* Mobile: keep it clean */
@media (max-width: 980px){
  .shopHero .shopHeaderCenter{ text-align: left; margin-top: 0; }
}
"@

  $css = $css + "`r`n" + $append
  Set-Content -Path $cssPath -Value $css -Encoding UTF8
}

Write-Host "DONE: Shop.jsx overwritten + CSS overrides appended." -ForegroundColor Green
Write-Host "VERIFY: showing key markers + section headers..." -ForegroundColor Cyan
Select-String -Path $shopPath -Pattern "shopHeaderCenter|shopTabs|sec-pokemon|sec-onepiece|sec-mtg|pillHeader" -Context 0,1
Select-String -Path $cssPath  -Pattern "CKK_SHOP_LAYOUT_STACKED_V3" -Context 0,1

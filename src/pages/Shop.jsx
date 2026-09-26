import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SHOP_GAMES, SHOP_GROUPS } from "../data/shopGroups.js";

const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");
const API = import.meta.env.VITE_STOREFRONT_API_URL || "";
const money = (cents) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export default function Shop({ game = "pokemon" }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [openGroups, setOpenGroups] = useState(() => new Set());
  const [selectedSet, setSelectedSet] = useState(null);
  const [listings, setListings] = useState([]);
  const [listingStatus, setListingStatus] = useState("");
  const [cartCount, setCartCount] = useState(() => { try { return JSON.parse(localStorage.getItem("ckk_cart") || "[]").reduce((sum, item) => sum + Number(item.quantity || 0), 0); } catch { return 0; } });
  const query = params.get("q") || "";
  const kind = params.get("kind") || "all";
  const activeGame = SHOP_GAMES.find((item) => item.key === game) || SHOP_GAMES[0];
  const groups = SHOP_GROUPS[activeGame.key] || [];

  useEffect(() => {
    if (!selectedSet) { setListings([]); setListingStatus(""); return undefined; }
    let active = true;
    setListingStatus("Loading available products…");
    const queryString = new URLSearchParams({ game: activeGame.key, set: selectedSet.name });
    if (kind !== "all") queryString.set("kind", kind);
    fetch(`${API}/api/storefront/listings?${queryString}`).then((response) => response.json().then((body) => ({ response, body }))).then(({ response, body }) => {
      if (!active) return;
      if (!response.ok) throw new Error(body.error || "Products could not be loaded.");
      setListings(body.listings || []);
      setListingStatus(body.listings?.length ? "" : "No published inventory is currently available for this set.");
    }).catch((error) => { if (active) { setListings([]); setListingStatus(error.message); } });
    return () => { active = false; };
  }, [selectedSet, activeGame.key, kind]);

  const visibleGroups = useMemo(() => {
    const needle = normalize(query);
    return groups.map((entry) => ({
      ...entry,
      sets: entry.sets.filter((set) => (!needle || normalize(`${set.code} ${set.name}`).includes(needle)) && (kind === "all" || set.kinds.includes(kind))),
    })).filter((entry) => entry.sets.length > 0);
  }, [groups, query, kind]);

  function chooseGame(item) {
    setOpenGroups(new Set());
    setSelectedSet(null);
    navigate(`${item.path}${kind !== "all" ? `?kind=${kind}` : ""}`);
  }

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (!value || value === "all") next.delete(key); else next.set(key, value);
    setParams(next);
    setOpenGroups(new Set());
    setSelectedSet(null);
  }

  function addToCart(listing) {
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem("ckk_cart") || "[]"); } catch { cart = []; }
    const existing = cart.find((item) => item.listingId === listing.id);
    if (existing) existing.quantity = Math.min(Number(listing.quantity), Number(existing.quantity) + 1);
    else cart.push({ listingId: listing.id, name: listing.product_name, priceCents: Number(listing.price_cents), quantity: 1, itemType: listing.item_type, shipsSeparately: false, imageUrl: listing.listing_image_url || "" });
    localStorage.setItem("ckk_cart", JSON.stringify(cart));
    setCartCount(cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0));
    setListingStatus(`${listing.product_name} was added to your cart.`);
  }

  function toggleGroup(label) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  }

  return <section className="hero shopHero heroCardStandard">
    <div className="heroBg" aria-hidden="true" style={{ backgroundImage: "url('/img/hero-card-art.jpg')" }} />
    <div className="heroBg shopArtBg" aria-hidden="true" /><div className="heroBgBack" aria-hidden="true" /><div className="heroBgFront" aria-hidden="true" />
    <div className="heroInner shopHeroInner">
      <header className="shopHeader"><h1 className="heroTitle shopTitle">Shop</h1><p className="heroSubline shopTagline">Every era. Every chase. Find your lane.</p></header>
      <nav className="shopTabs" aria-label="Trading card games">{SHOP_GAMES.map((item) => <button key={item.key} type="button" className={`pillBtn shopTab${item.key === activeGame.key ? " isActive" : ""}`} onClick={() => chooseGame(item)}>{item.label}</button>)}</nav>
      <div className="shopTools">
        <label className="shopSearch"><span className="srOnly">Search sets</span><input type="search" value={query} onChange={(event) => updateParam("q", event.target.value)} placeholder={`Search ${activeGame.label} sets…`} /></label>
        <div className="shopKind" aria-label="Product type">{[["all", "All"], ["sealed", "Sealed"], ["singles", "Singles"]].map(([value, label]) => <button key={value} type="button" className={`pillBtn shopKindBtn${kind === value ? " isActive" : ""}`} onClick={() => updateParam("kind", value)}>{label}</button>)}</div>
      </div>
      <div className="shopCartBar"><span>{selectedSet ? `Viewing ${selectedSet.name}` : "Choose a set to view available inventory."}</span><Link className="pillBtn shopCartLink" to="/checkout">Cart ({cartCount})</Link></div>
      <div className="shopSections" aria-live="polite">
        <div className="shopCatalogHeading"><h2>{activeGame.label}</h2></div>
        {visibleGroups.map((entry) => { const expanded = Boolean(query) || openGroups.has(entry.label); return <section className="shopEra" key={entry.label}>
          <button className="shopEraToggle" type="button" aria-expanded={expanded} onClick={() => toggleGroup(entry.label)}><span>{entry.label}</span><span className="shopEraCount">{entry.sets.length}</span><span aria-hidden="true">{expanded ? "−" : "+"}</span></button>
          {expanded && <div className="shopSetRows">{entry.sets.map((set) => <button type="button" className={`shopSetRow${selectedSet?.code === set.code && selectedSet?.name === set.name ? " isSelected" : ""}`} key={`${set.code}-${set.name}`} onClick={() => setSelectedSet(set)}><span className="shopSetCode">{set.code}</span><span className="shopSetFullName">{set.name}</span><span className="shopSetArrow" aria-hidden="true">›</span></button>)}</div>}
        </section>; })}
        {!visibleGroups.length && <p className="shopEmpty">No sets match those filters.</p>}
        {selectedSet && <section className="shopProducts" aria-label={`${selectedSet.name} available products`}><div className="shopProductsHeading"><h2>{selectedSet.name}</h2><button type="button" className="pillBtn" onClick={() => setSelectedSet(null)}>Close products</button></div>{listingStatus && <p className="shopProductStatus" role="status">{listingStatus}</p>}<div className="shopProductGrid">{listings.map((listing) => <article className="shopProductCard" key={listing.id}><div className="shopProductImage">{listing.listing_image_url ? <img src={listing.listing_image_url} alt="" loading="lazy" /> : <span aria-hidden="true">✦</span>}</div><div className="shopProductBody"><div className="shopProductBadges"><span>{listing.item_type === "SEALED" ? "Sealed" : listing.item_type === "SINGLE" ? "Single" : "Other"}</span>{listing.ownership === "CONSIGNMENT" && <span>Consignment</span>}</div><h3>{listing.product_name}</h3>{listing.card_condition && <p>{listing.card_condition}</p>}<div className="shopProductBuy"><strong>{money(listing.price_cents)}</strong><button type="button" className="btn primary" onClick={() => addToCart(listing)}>Add to cart</button></div></div></article>)}</div></section>}
      </div>
    </div>
  </section>;
}

import React, { useMemo, useState } from "react";

export default function Shop() {
  const filters = ["Pokémon", "One Piece", "MTG", "Sealed", "Singles"];
  const [active, setActive] = useState("Pokémon");

  const products = useMemo(
    () => [
      { title: "Placeholder Product A", price: "$39.99", img: "/img/placeholder-a.png" },
      { title: "Placeholder Product B", price: "$119.99", img: "/img/placeholder-b.png" },
      { title: "Placeholder Product C", price: "$6.99", img: "/img/placeholder-c.png" },
      { title: "Placeholder Product D", price: "$89.99", img: "/img/placeholder-d.png" },
      { title: "Placeholder Product E", price: "$24.99", img: "/img/placeholder-e.png" },
      { title: "Placeholder Product F", price: "$14.99", img: "/img/placeholder-f.png" },
    ],
    []
  );

  return (
    <section className="hero shopHero" aria-label="Shop">
      <div className="heroInner">
        <div className="heroLeft">
          <h1 className="heroTitle">Shop</h1>
          <p className="heroSubline">Phase 1 scaffold — inventory wiring comes next.</p>

          <div className="shopControls">
            <div className="shopFilters" role="tablist" aria-label="Shop filters">
              {filters.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={"pill shopPill" + (active === f ? " isActive" : "")}
                  onClick={() => setActive(f)}
                  aria-pressed={active === f}
                >
                  {f}
                </button>
              ))}
            </div>

            <label className="shopSort">
              <span className="shopSortLabel">Sort</span>
              <select className="shopSortSelect" defaultValue="featured">
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
                <option value="newest">Newest</option>
              </select>
            </label>
          </div>

          <div className="shopGrid" aria-label="Products">
            {products.map((p) => (
              <article className="productCard" key={p.title}>
                <div className="productMedia" aria-hidden="true">
                  <img
                    src={p.img}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                <div className="productBody">
                  <div className="productTitle">{p.title}</div>
                  <div className="productPrice">{p.price}</div>
                </div>

                <button type="button" className="btn productBtn">
                  View
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

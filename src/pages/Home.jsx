import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="stack" style={{ gap: 18 }}>
      <section className="hero">
        <div className="heroCard">
          <div className="eyebrow">Modern arcane • TCG + collectibles</div>
          <h1 className="title">The Crystal Card Keep</h1>
          <p className="lead">
            A store-first build that looks like a real business to distributors today—and becomes a
            best-in-class marketplace tomorrow.
          </p>

          <div className="ctaRow">
            <Link className="btnPrimary" to="/inventory">Browse Inventory</Link>
            <Link className="btn" to="/live">Live / Rip & Ship</Link>
            <Link className="btn" to="/preorders">Preorders</Link>
          </div>

          <div className="callouts">
            <div className="callout">
              <div className="calloutTitle">Sealed limits (fairness)</div>
              <div className="calloutBody">2/day per item (SKU) per account. Singles unlimited.</div>
            </div>
            <div className="callout">
              <div className="calloutTitle">Shipping rules (simple)</div>
              <div className="calloutBody">$5 singles/boosters up to $50. $15 sealed up to $100. Free over $100.</div>
            </div>
            <div className="callout">
              <div className="calloutTitle">Marketplace (coming soon)</div>
              <div className="calloutBody">5% fee with account tier discounts. $0.99 minimum fee (planned).</div>
            </div>
          </div>
        </div>

        <div className="heroArt" aria-hidden>
          <div className="sigil" />
          <div className="runes" />
          <div className="glow" />
        </div>
      </section>

      <section className="grid3">
        <div className="panel">
          <h2>What we do</h2>
          <ul className="bullets">
            <li>Sell sealed product + singles</li>
            <li>Buy / sell / trade locally (by appointment)</li>
            <li>Rip & ship streams (Whatnot + more)</li>
            <li>Preorders with clear cutoffs + allocation rules</li>
          </ul>
        </div>
        <div className="panel">
          <h2>Built for fairness</h2>
          <p className="muted">
            Stock is real-time and decremented as orders are placed (store build). Sealed items are
            limited to protect the community from cart-bots.
          </p>
          <Link className="textLink" to="/policies">See policies →</Link>
        </div>
        <div className="panel">
          <h2>Distributor-ready</h2>
          <p className="muted">
            Clean ops, clear policies, and a visible brand. If you’re a distributor or brand rep,
            we’d love to connect.
          </p>
          <Link className="textLink" to="/about">About the business →</Link>
        </div>
      </section>
    </div>
  )import React from "react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero.jsx";

export default function Home() {
  return (
    <div className="stack" style={{ gap: 18 }}>
      <Hero />

      <section className="grid3">
        <div className="panel">
          <h2>What we do</h2>
          <ul className="bullets">
            <li>Sell sealed product + singles</li>
            <li>Buy / sell / trade locally (by appointment)</li>
            <li>Rip & ship streams (Whatnot + more)</li>
            <li>Preorders with clear cutoffs + allocation rules</li>
          </ul>
        </div>

        <div className="panel">
          <h2>Built for fairness</h2>
          <p className="muted">
            Stock is real-time and decremented as orders are placed (store build). Sealed items are
            limited to protect the community from cart-bots.
          </p>
          <Link className="textLink" to="/policies">
            See policies →
          </Link>
        </div>

        <div className="panel">
          <h2>Distributor-ready</h2>
          <p className="muted">
            Clean ops, clear policies, and a visible brand. If you’re a distributor or brand rep,
            we’d love to connect.
          </p>
          <Link className="textLink" to="/about">
            About the business →
          </Link>
        </div>
      </section>
    </div>
  );
}

}

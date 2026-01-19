import React from 'react'

export default function Policies() {
  return (
    <div className="stack" style={{ gap: 18 }}>
      <section className="card">
        <h1 className="h1">Policies</h1>
        <p className="p">
          These are the store policies for purchases made directly from The Crystal Card Keep. Marketplace policies will be published once the marketplace launches.
        </p>
      </section>

      <section className="grid2">
        <div className="pane">
          <h2 className="h2">Shipping</h2>
          <ul className="list">
            <li><strong>Singles + booster packs:</strong> $5 flat rate up to $50 order total.</li>
            <li><strong>Sealed (excluding booster packs):</strong> $15 flat rate up to $100 cart total.</li>
            <li><strong>Free shipping:</strong> orders over $100.</li>
            <li>Shipping is shown at checkout and may adjust for oversize/insurance.</li>
          </ul>
        </div>
        <div className="pane">
          <h2 className="h2">Limits & allocation</h2>
          <ul className="list">
            <li><strong>Sealed product:</strong> max 2/day per item (SKU) per account.</li>
            <li><strong>Singles:</strong> no per-item limit (unless explicitly stated).</li>
            <li><strong>Address fairness:</strong> goal is no more than 8 of a sealed item to the same shipping address within 24 hours.</li>
            <li>Allocation-based sales may override limits during high-demand releases.</li>
          </ul>
        </div>
      </section>

      <section className="grid2">
        <div className="pane">
          <h2 className="h2">Condition standards</h2>
          <p className="p">
            We list cards conservatively. "Near Mint" means pack-fresh to light handling. Any noticeable issues are called out.
          </p>
        </div>
        <div className="pane">
          <h2 className="h2">Returns</h2>
          <p className="p">
            Returns are supported for order errors or damage in transit (photo evidence required). For sealed items, returns require the factory seal to be intact.
          </p>
        </div>
      </section>
    </div>
  )
}

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
            <li><strong>Economy Letter:</strong> $1.99 for eligible singles-only orders under $50. This service is untracked and does not include a guaranteed delivery scan.</li>
            <li><strong>Standard tracked shipping:</strong> $7.99 for orders under $75.</li>
            <li><strong>Free standard tracked shipping:</strong> orders of $75 or more.*</li>
            <li>*Free shipping includes the first standard package. A $5 charge applies for each additional package or when the first package weighs more than 50 lb. An additional package is not charged twice when it is also over 50 lb.</li>
            <li>Freight and exceptional oversized products are identified separately. Every applicable charge is shown before payment.</li>
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

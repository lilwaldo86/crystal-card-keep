import React from 'react'

export default function Marketplace() {
  return (
    <div className="stack" style={{ gap: 18 }}>
      <section className="card">
        <h1 className="h1">Marketplace (Backburner)</h1>
        <p className="p">
          The marketplace experience is planned, but we’re prioritizing the storefront, inventory structure, and category system first.
        </p>
        <div className="callout">
          <div className="calloutTitle">Fee vision (when marketplace launches)</div>
          <ul className="list">
            <li>Platform fee target: 5% with tiered discounts by account level</li>
            <li>Minimum transaction fee: $0.99 (to cover processing + ops)</li>
            <li>Anti-bot protections: CAPTCHA / rate limits / address-based caps for sealed allocations</li>
          </ul>
        </div>
      </section>

      <section className="card">
        <h2 className="h2">What’s next</h2>
        <ul className="list">
          <li>Finish category + inventory navigation</li>
          <li>Finalize shipping rules + policy pages</li>
          <li>Add checkout + payments (Stripe / PayPal etc.) after the above is stable</li>
        </ul>
      </section>
    </div>
  )
}

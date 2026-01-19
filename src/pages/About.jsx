import React from 'react'

export default function About() {
  return (
    <div className="stack" style={{ gap: 18 }}>
      <section className="card">
        <h1 className="h1">About The Crystal Card Keep</h1>
        <p className="p">
          The Crystal Card Keep is a Missouri-based, store-first trading post for TCGs, sports cards, and collectible curios.
        </p>
        <div className="grid2">
          <div className="pane">
            <h3 className="h3">What we are today</h3>
            <ul className="list">
              <li>Curated sealed product and singles</li>
              <li>Clear shipping policies and simple pricing</li>
              <li>Live breaks / rip & ship scheduled around Whatnot</li>
              <li>Fast, polite, and reliable communication</li>
            </ul>
          </div>
          <div className="pane">
            <h3 className="h3">What we are building</h3>
            <ul className="list">
              <li>A marketplace (coming later) with a 5% fee and a $0.99 minimum transaction fee</li>
              <li>Anti-bot purchase controls, account levels, and fair allocation</li>
              <li>Inventory tooling to scale from “our stock” to “every card”</li>
              <li>Scavenger-hunt easter eggs that unlock single-use rewards</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="h2">Distributor-ready essentials</h2>
        <div className="grid3">
          <div className="pane">
            <h3 className="h3">Operations</h3>
            <p className="p">Ship-to-customer + rip & ship workflows. Inventory is tracked per item and can be adjusted as new stock arrives.</p>
          </div>
          <div className="pane">
            <h3 className="h3">Allocation + limits</h3>
            <p className="p">Sealed product limits are enforced per-item (2/day per SKU). Singles have no limit.</p>
          </div>
          <div className="pane">
            <h3 className="h3">Identity</h3>
            <p className="p">A modern arcane brand: dark, premium, and crystal-lit—without being loud or cluttered.</p>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="h2">Contact</h2>
        <p className="p">
          Add your business email + social links here once you’re ready. For now, this site is structured so you can slot those in fast.
        </p>
      </section>
    </div>
  )
}

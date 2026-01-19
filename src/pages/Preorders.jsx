import React from 'react'
import { PREORDERS } from '../data/preorders'

function Item({ p }) {
  return (
    <div className="listRow">
      <div>
        <div className="rowTitle">{p.name}</div>
        <div className="rowMeta">
          {p.game} • {p.set} • Window: {p.window}
        </div>
        <div className="rowNote">{p.note}</div>
      </div>
      <div className="rowRight">
        <div className="price">{p.priceNote}</div>
        <a className="btn btn--ghost" href={p.actionHref} target="_blank" rel="noreferrer">
          {p.actionLabel}
        </a>
      </div>
    </div>
  )
}

export default function Preorders() {
  return (
    <div className="stack" style={{ gap: 18 }}>
      <section className="card">
        <h1 className="h1">Preorders</h1>
        <p className="p">
          We’ll list allocations and preorder windows here as we confirm them. (This page is built to look legitimate for distributors, but it’s also functional.)
        </p>
        <div className="callout">
          <div className="calloutTitle">Allocation first. Limits apply to sealed items.</div>
          <div className="calloutText">Singles do not have daily limits. Sealed SKUs are limited to 2/day per account per SKU unless noted otherwise.</div>
        </div>
      </section>

      <section className="card">
        <div className="list">
          {PREORDERS.map((p) => (
            <Item key={p.id} p={p} />
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="h2">Distributor-ready notes</h2>
        <ul className="bullets">
          <li>We maintain live inventory counts and can add new SKUs as stock arrives.</li>
          <li>We enforce anti-bot and per-SKU limits on sealed items to keep allocations fair.</li>
          <li>We can run launch-week live breaks and direct-to-customer fulfillment.</li>
        </ul>
      </section>
    </div>
  )
}

import React from 'react'

export default function Live() {
  return (
    <div className="stack" style={{ gap: 18 }}>
      <section className="card">
        <h1 className="h1">Live Breaking • Rip & Ship</h1>
        <p className="p">
          Live singles, sealed product, quick auctions, and rip-and-ship sessions from The Crystal Card Keep.
        </p>
        <div className="grid2">
          <div className="subcard">
            <h3 className="h3">Where we stream</h3>
            <ul className="bullets">
              <li><a href="https://www.whatnot.com/user/mandingo6420" target="_blank" rel="noopener noreferrer">Whatnot — Mandingo6420</a></li>
              <li>Additional live channels will be announced here.</li>
            </ul>
            <a className="btn primary" href="https://www.whatnot.com/user/mandingo6420" target="_blank" rel="noopener noreferrer">Open Whatnot stream</a>
          </div>
          <div className="subcard">
            <h3 className="h3">How rip & ship works</h3>
            <ul className="bullets">
              <li>You buy a pack/box/slot during the show</li>
              <li>We open it live, sleeve/topload immediately</li>
              <li>Hits ship to you with tracking</li>
              <li>Bulk options available by request</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="h2">Stream schedule</h2>
        <p className="p muted">Weekly schedules will be posted here and shared with subscribers once scheduling notifications launch.</p>
      </section>
    </div>
  )
}

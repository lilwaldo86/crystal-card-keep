import React from 'react'

export default function Live() {
  return (
    <div className="stack" style={{ gap: 18 }}>
      <section className="card">
        <h1 className="h1">Live Breaking • Rip & Ship</h1>
        <p className="p">
          We run live breaks and rip-and-ship streams. This page is intentionally simple right now — it’s here so distributors (and customers) can see that the business is operational.
        </p>
        <div className="grid2">
          <div className="subcard">
            <h3 className="h3">Where we stream</h3>
            <ul className="bullets">
              <li>Whatnot (primary)</li>
              <li>eBay Live (planned)</li>
              <li>TikTok Live (planned)</li>
            </ul>
            <div className="note">
              Add your stream links in <code>src/pages/Live.jsx</code>.
            </div>
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
        <p className="p muted">Coming soon. We’ll post weekly schedules here.</p>
      </section>
    </div>
  )
}

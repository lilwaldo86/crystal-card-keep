import React from 'react'

export default function LocationHours() {
  return (
    <div className="stack" style={{ gap: 18 }}>
      <section className="card">
        <h1 className="h1">Hours & Location</h1>
        <p className="p">
          Online-first business based in Missouri (Saint James / Rolla area). Local pickup may be available on scheduled days.
        </p>
        <div className="grid2">
          <div className="subcard">
            <div className="subTitle">Customer support hours</div>
            <ul className="bullets">
              <li>Mon–Fri: 9am–6pm CT</li>
              <li>Sat: 10am–2pm CT</li>
              <li>Sun: Closed (except live events)</li>
            </ul>
          </div>
          <div className="subcard">
            <div className="subTitle">Contact</div>
            <ul className="bullets">
              <li>Email: <span className="muted">(add your email in the footer)</span></li>
              <li>Whatnot: <span className="muted">(add your handle)</span></li>
              <li>Instagram/TikTok: <span className="muted">(add your handles)</span></li>
            </ul>
          </div>
        </div>
        <div className="note">
          Tip: When you’re ready, I can add a full contact form with spam protection (Turnstile) and a Google Maps embed.
        </div>
      </section>
    </div>
  )
}

import React from "react";
import { Link } from "react-router-dom";
import "../App.css";

export default function Contact() {
  const bgBack = "/img/crystal-card-keep-bc-back.png";
  const bgFront = "/img/crystal-card-keep-bc-front.png";

  return (
    <div className="appRoot">
      <div className="gridOverlay" aria-hidden="true" />

      <header className="siteHeader">
        <div className="wrap navBar">
          <Link className="brand" to="/" aria-label="The Crystal Card Keep">
            <span className="sigil" aria-hidden="true" />
            <span className="brandText">
              <span className="brandName">THE CRYSTAL CARD KEEP</span>
              <span className="brandTag">Buy • Sell • Trade</span>
            </span>
          </Link>

          <nav className="navLinks" aria-label="Primary navigation">
            <a href="/shop">Shop</a>
            <a href="/sell">Sell</a>
            <a href="/trade">Trade</a>
            <a href="/live">Live</a>
            <Link to="/contact">Contact</Link>
          </nav>

          <div className="navActions">
            <a className="btn" href="/sell">
              Sell to us
            </a>
            <a className="btn primary" href="/shop">
              Shop
            </a>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="wrap">
          <section className="hero" aria-label="Contact">
            <div
              className="heroBg heroBgBack"
              style={{ backgroundImage: `url(${bgBack})` }}
              aria-hidden="true"
            />
            <div
              className="heroBg heroBgFront"
              style={{ backgroundImage: `url(${bgFront})` }}
              aria-hidden="true"
            />

            <div className="heroInner">
              <div className="heroLeft">
                <h1 className="heroTitle">Contact</h1>
                <p className="heroSubline">THE CRYSTAL CARD KEEP</p>

                <div className="contactCard">
                  <h3>Business Information</h3>

                  <p>
                    <strong>The Crystal Card Keep</strong><br />
                    1028 S. Bishop Ave, PMB 174<br />
                    Rolla, MO 65401
                  </p>

                  <p>
                    <strong>Email</strong><br />
                    <a href="mailto:chris.waldron319@thecrystalcardkeep.com">
                      chris.waldron319@thecrystalcardkeep.com
                    </a>
                  </p>

                  <p style={{ marginBottom: 0, color: "rgba(255,255,255,0.62)", fontSize: 13 }}>
                    For order help, trades, or bulk buys, email us anytime.
                  </p>
                </div>
              </div>

              <aside className="heroRight" aria-label="Message form">
                <div className="contactCard subtle">
                  <h3>Send a Message</h3>

                  <form className="contactForm" onSubmit={(e) => e.preventDefault()}>
                    <input name="name" placeholder="Your name" />
                    <input name="email" placeholder="Your email" type="email" />
                    <textarea name="message" placeholder="Message" rows="5" />
                    <button className="btn primary" type="submit">
                      Send message
                    </button>
                  </form>

                  <p style={{ marginTop: 10, color: "rgba(255,255,255,0.56)", fontSize: 12 }}>
                    (Form is visual only for now — we’ll wire delivery later if you want.)
                  </p>
                </div>
              </aside>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

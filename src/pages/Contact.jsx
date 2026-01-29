import React from "react";

export default function Contact() {
  // Keep the same watermark/blur vibe as the home hero
  const bgBack = "/img/crystal-card-keep-bc-back.png";
  const bgFront = "/img/crystal-card-keep-bc-front.png";

  return (
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

      <div className="heroInner contactInner">
        <div className="contactTop">
          <h1 className="heroTitle">Contact</h1>
          <p className="heroSubline">THE CRYSTAL CARD KEEP</p>
        </div>

        <div className="contactGrid">
          {/* LEFT: business info */}
          <div className="contactCol">
            <div className="contactCard">
              <h3>Business Information</h3>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>The Crystal Card Keep</div>
                <div style={{ marginTop: 6, color: "rgba(255,255,255,0.78)" }}>
                  1028 S. Bishop Ave, PMB 174
                  <br />
                  Rolla, MO 65401
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>Email</div>
                <div style={{ marginTop: 6, color: "rgba(255,255,255,0.82)", wordBreak: "break-word" }}>
                  chris.waldron319@thecrystalcardkeep.com
                </div>
                <div style={{ marginTop: 10, color: "rgba(255,255,255,0.50)" }}>
                  For order help, trades, or bulk buys, email us anytime.
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: message form */}
          <div className="contactCol">
            <div className="contactCard subtle">
              <h3>Send a Message</h3>

              <form
                className="contactForm"
                onSubmit={(e) => {
                  e.preventDefault();
                  // Visual only for now — wiring comes next.
                }}
              >
                <input name="name" placeholder="Your name" autoComplete="name" />
                <input name="email" placeholder="Your email" autoComplete="email" />
                <textarea name="message" placeholder="Message" rows={6} />
                <button type="submit" className="btn primary" style={{ width: "100%" }}>
                  Send message
                </button>

                <small style={{ color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
                  (We’ll wire delivery next — this is layout-first.)
                </small>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

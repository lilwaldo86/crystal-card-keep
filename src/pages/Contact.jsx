import React, { useEffect, useState } from "react";

export default function Contact() {
  // Keep the same watermark/blur vibe as the home hero
  const bgBack = "/img/crystal-card-keep-bc-back.png";
  const bgFront = "/img/crystal-card-keep-bc-front.png";

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Load Turnstile script once (SPA-safe)
    const id = "cf-turnstile-script";
    if (document.getElementById(id)) return;

    const s = document.createElement("script");
    s.id = id;
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    s.defer = true;
    document.body.appendChild(s);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setSending(true);

    try {
      const turnstileToken = window.turnstile?.getResponse();
      if (!turnstileToken) {
        setStatus("Please complete the verification check.");
        setSending(false);
        return;
      }

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, turnstileToken })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setStatus("Message sent successfully.");
        setForm({ name: "", email: "", message: "" });
        try { window.turnstile?.reset(); } catch {}
      } else {
        setStatus(data.error || "Error sending message.");
        try { window.turnstile?.reset(); } catch {}
      }
    } catch {
      setStatus("Error sending message.");
      try { window.turnstile?.reset(); } catch {}
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="hero" aria-label="Contact">
      <div
        className="heroBg heroBgBack"
        style={{ backgroundImage: url() }}
        aria-hidden="true"
      />
      <div
        className="heroBg heroBgFront"
        style={{ backgroundImage: url() }}
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

              <form className="contactForm" onSubmit={handleSubmit}>
                <input
                  name="name"
                  placeholder="Your name"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
                <input
                  name="email"
                  placeholder="Your email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
                <textarea
                  name="message"
                  placeholder="Message"
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  required
                />

                <div
                  className="cf-turnstile"
                  data-sitekey="0x4AAAAAACkf8vOsYYjXuW7-"
                ></div>

                <button type="submit" className="btn primary" style={{ width: "100%" }} disabled={sending}>
                  {sending ? "Sending..." : "Send message"}
                </button>

                {status ? (
                  <small style={{ color: "rgba(255,255,255,0.70)", marginTop: 6, display: "block" }}>
                    {status}
                  </small>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

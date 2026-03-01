import React, { useState } from "react";

export default function Contact() {
  const bgBack = "/img/crystal-card-keep-bc-back.png";
  const bgFront = "/img/crystal-card-keep-bc-front.png";

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");

    const turnstileToken = window.turnstile?.getResponse();

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, turnstileToken })
    });

    const data = await res.json();

    if (data.success) {
      setStatus("Message sent successfully.");
      setForm({ name: "", email: "", message: "" });
    } else {
      setStatus(data.error || "Error sending message.");
    }
  };

  return (
    <section className="hero" aria-label="Contact">
      <div className="heroBg heroBgBack" style={{ backgroundImage: url() }} />
      <div className="heroBg heroBgFront" style={{ backgroundImage: url() }} />

      <div className="heroInner contactInner">
        <div className="contactTop">
          <h1 className="heroTitle">Contact</h1>
          <p className="heroSubline">THE CRYSTAL CARD KEEP</p>
        </div>

        <div className="contactGrid">
          <div className="contactCol">
            <div className="contactCard">
              <h3>Business Information</h3>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>The Crystal Card Keep</div>
                <div style={{ marginTop: 6, color: "rgba(255,255,255,0.78)" }}>
                  1028 S. Bishop Ave, PMB 174<br/>Rolla, MO 65401
                </div>
              </div>
            </div>
          </div>

          <div className="contactCol">
            <div className="contactCard subtle">
              <h3>Send a Message</h3>
              <form className="contactForm" onSubmit={handleSubmit}>
                <input value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Your name" required />
                <input value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="Your email" required />
                <textarea rows={6} value={form.message} onChange={e => setForm({...form, message:e.target.value})} placeholder="Message" required />
                <div class="cf-turnstile" data-sitekey="0x4AAAAAACkf8vOsYYjXuW7-"></div>
                <button type="submit" className="btn primary" style={{ width: "100%" }}>
                  Send message
                </button>
                {status && <small style={{ color: "rgba(255,255,255,0.7)" }}>{status}</small>}
              </form>
            </div>
          </div>
        </div>
      </div>

      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    </section>
  );
}

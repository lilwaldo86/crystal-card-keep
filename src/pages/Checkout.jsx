import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_STOREFRONT_API_URL || "";
const money = (cents) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

function loadSquare(environment) {
  if (window.Square) return Promise.resolve();
  const src = environment === "production" ? "https://web.squarecdn.com/v1/square.js" : "https://sandbox.web.squarecdn.com/v1/square.js";
  return new Promise((resolve, reject) => {
    const script = document.createElement("script"); script.src = src;
    script.onload = resolve; script.onerror = () => reject(new Error("Square checkout could not load."));
    document.head.appendChild(script);
  });
}

export default function Checkout() {
  const [cart] = useState(() => {
    const sandboxTest = new URLSearchParams(window.location.search).get("sandboxTest") === "1";
    if (sandboxTest) return [{ listingId: "sandbox_test_card_001", name: "Square Sandbox Test Card", priceCents: 100, quantity: 1, itemType: "SINGLE", shipsSeparately: false }];
    try { return JSON.parse(localStorage.getItem("ckk_cart") || "[]"); } catch { return []; }
  });
  const [config, setConfig] = useState(null);
  const [shippingService, setShippingService] = useState("standard");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState({ recipientName: "", line1: "", line2: "", city: "", region: "MO", postalCode: "", countryCode: "US", phone: "" });
  const [quote, setQuote] = useState(null);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(null);
  const cardRef = useRef(null);
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + Number(item.priceCents || 0) * Number(item.quantity || 0), 0), [cart]);
  const economyEligible = subtotal < 5000 && cart.length > 0 && cart.every((item) => item.itemType === "SINGLE" && !item.shipsSeparately);
  const addressComplete = [address.recipientName, address.line1, address.city, address.region, address.postalCode, address.countryCode].every((value) => value.trim());

  useEffect(() => {
    let active = true;
    fetch(`${API}/api/payments/config`).then((response) => response.json()).then(async (next) => {
      if (!active) return; setConfig(next);
      if (!next.checkoutEnabled) throw new Error("Online checkout is not open yet. Please check back soon.");
      if (!next.configured) throw new Error("Square sandbox has not been configured.");
      await loadSquare(next.environment);
      if (!active) return;
      const payments = window.Square.payments(next.applicationId, next.locationId);
      cardRef.current = await payments.card();
      await cardRef.current.attach("#square-card");
    }).catch((error) => active && setMessage(error.message));
    return () => { active = false; cardRef.current?.destroy?.(); };
  }, []);

  useEffect(() => {
    if (!cart.length || !addressComplete) { setQuote(null); return undefined; }
    let active = true;
    const timer = window.setTimeout(async () => {
      setQuoteBusy(true);
      try {
        const response = await fetch(`${API}/api/storefront/quote`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ shippingService, address, items: cart.map((item) => ({ listingId: item.listingId, quantity: item.quantity })) }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Order total could not be calculated.");
        if (active) { setQuote(result); setMessage(""); }
      } catch (error) { if (active) { setQuote(null); setMessage(error.message); } }
      finally { if (active) setQuoteBusy(false); }
    }, 350);
    return () => { active = false; window.clearTimeout(timer); };
  }, [cart, shippingService, address.recipientName, address.line1, address.line2, address.city, address.region, address.postalCode, address.countryCode, address.phone, addressComplete]);

  async function pay(event) {
    event.preventDefault(); if (!cardRef.current || !cart.length) return;
    setBusy(true); setMessage("");
    try {
      const token = await cardRef.current.tokenize();
      if (token.status !== "OK") throw new Error(token.errors?.[0]?.message || "Card details could not be verified.");
      const response = await fetch(`${API}/api/storefront/checkout`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceId: token.token, email, shippingService, address, items: cart.map((item) => ({ listingId: item.listingId, quantity: item.quantity })) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Payment was not completed.");
      localStorage.removeItem("ckk_cart"); setComplete(result);
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }

  if (complete) return <section className="hero heroCardStandard checkoutShell"><div className="heroBg heroBgBack" aria-hidden="true" /><div className="heroBg heroBgFront" aria-hidden="true" /><div className="checkoutViewport"><div className="checkoutPanel"><h1>Payment complete</h1><p>Your sandbox order was recorded.</p><p className="checkoutOrder">Order {complete.orderId}</p><Link className="btn primary" to="/shop">Return to shop</Link></div></div></section>;

  return <section className="hero heroCardStandard checkoutShell"><div className="heroBg heroBgBack" aria-hidden="true" /><div className="heroBg heroBgFront" aria-hidden="true" /><div className="checkoutViewport"><div className="checkoutPanel">
    <header><p className="eyebrow">Secure Square Sandbox</p><h1>Checkout</h1><p>No real card will be charged while this page is in Sandbox.</p></header>
    {config && !config.checkoutEnabled ? <div className="checkoutEmpty"><p>Online checkout is not open yet. Products may be browsed while final payment and tax configuration is completed.</p><Link className="btn primary" to="/shop">Return to shop</Link></div> : !cart.length ? <div className="checkoutEmpty"><p>Your cart is empty. Checkout is connected and waiting for purchasable inventory.</p><Link className="btn primary" to="/shop">Return to shop</Link></div> : <form onSubmit={pay} className="checkoutGrid">
      <div className="checkoutItems"><h2>Order</h2>{cart.map((item) => <div className="checkoutLine" key={item.listingId}><span>{item.name} × {item.quantity}</span><strong>{money(item.priceCents * item.quantity)}</strong></div>)}<div className="checkoutLine checkoutSubtotal"><span>Subtotal</span><strong>{money(subtotal)}</strong></div></div>
      <div className="checkoutPayment"><h2>Delivery</h2>{economyEligible && <label className="checkoutChoice"><input type="radio" name="shipping" checked={shippingService === "economy"} onChange={() => setShippingService("economy")} /> Economy Letter — $1.99 (untracked; buyer assumes delivery risk)</label>}<label className="checkoutChoice"><input type="radio" name="shipping" checked={shippingService === "standard"} onChange={() => setShippingService("standard")} /> Standard tracked — $7.99 under $75; free at $75+*</label><div className="checkoutAddress"><label>Recipient name<input required autoComplete="name" value={address.recipientName} onChange={(event) => setAddress((current) => ({ ...current, recipientName: event.target.value }))} /></label><label>Address<input required autoComplete="shipping address-line1" value={address.line1} onChange={(event) => setAddress((current) => ({ ...current, line1: event.target.value }))} /></label><label>Apartment, suite, etc. (optional)<input autoComplete="shipping address-line2" value={address.line2} onChange={(event) => setAddress((current) => ({ ...current, line2: event.target.value }))} /></label><div className="checkoutAddressRow"><label>City<input required autoComplete="shipping address-level2" value={address.city} onChange={(event) => setAddress((current) => ({ ...current, city: event.target.value }))} /></label><label>State<input required maxLength={2} autoComplete="shipping address-level1" value={address.region} onChange={(event) => setAddress((current) => ({ ...current, region: event.target.value.toUpperCase() }))} /></label><label>ZIP<input required autoComplete="shipping postal-code" value={address.postalCode} onChange={(event) => setAddress((current) => ({ ...current, postalCode: event.target.value }))} /></label></div><label>Phone (optional)<input type="tel" autoComplete="tel" value={address.phone} onChange={(event) => setAddress((current) => ({ ...current, phone: event.target.value }))} /></label></div><label className="checkoutEmail">Receipt email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><div className="checkoutTotals" aria-live="polite"><h2>Order total</h2><div><span>Subtotal</span><strong>{money(quote?.subtotalCents ?? subtotal)}</strong></div><div><span>Shipping</span><strong>{quote ? money(quote.shippingCents) : "Enter address"}</strong></div><div><span>Tax</span><strong>{quote ? money(quote.taxCents) : "—"}</strong></div><div className="checkoutGrandTotal"><span>Total</span><strong>{quote ? money(quote.totalCents) : "—"}</strong></div>{quote && !quote.taxConfigured && <small>Sandbox tax calculation is disabled. Production checkout remains blocked until tax is configured.</small>}<small>*Oversized or multi-package orders may include the disclosed $5 package surcharge.</small></div><h2>Payment</h2><div id="square-card" className="squareCard" />{message && <p className="checkoutError" role="alert">{message}</p>}<p className="checkoutTerms">By placing the order, you agree to the <Link to="/terms">Terms of Sale</Link>, <Link to="/policies">Store Policies</Link>, and <Link to="/privacy">Privacy notice</Link>.</p><button className="btn primary checkoutPay" type="submit" disabled={busy || quoteBusy || !config || !quote}>{busy ? "Processing…" : quoteBusy ? "Calculating…" : quote ? `Pay ${money(quote.totalCents)} securely with Square` : "Enter shipping address"}</button></div>
    </form>}
  </div></div></section>;
}

import React, { useState } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_STOREFRONT_API_URL || "";
const money = (cents) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(cents || 0) / 100);

export default function AdminOrders() {
  const [token, setToken] = useState("");
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [shipping, setShipping] = useState({});

  async function loadOrders() {
    setMessage("");
    try {
      const response = await fetch(`${API}/api/admin/orders`, { headers: { authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Orders could not be loaded.");
      setOrders(result.orders || []);
    } catch (error) { setMessage(error.message); }
  }

  async function fulfill(order) {
    const details = shipping[order.id] || {};
    setMessage("");
    try {
      const response = await fetch(`${API}/api/admin/orders/fulfill`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ saleId: order.id, carrier: details.carrier, trackingNumber: details.trackingNumber }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Order could not be fulfilled.");
      setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status: "FULFILLED" } : item));
      setMessage(`Order ${order.id} marked fulfilled.`);
    } catch (error) { setMessage(error.message); }
  }

  return <section className="hero heroCardStandard adminInventoryShell"><div className="heroBg heroBgBack" aria-hidden="true" /><div className="heroBg heroBgFront" aria-hidden="true" /><div className="adminInventoryScroller"><div className="adminInventoryPanel"><header><p className="eyebrow">Private administration</p><h1>Orders</h1><p>Review paid orders and record manually purchased shipping labels.</p></header><div className="adminInventoryForm"><label>Administrator token<input type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} /></label><div className="adminActions"><button className="btn primary" type="button" disabled={!token} onClick={loadOrders}>Load orders</button><Link className="btn" to="/admin/inventory/import">Inventory intake</Link></div>{message && <p role="status" className="adminMessage">{message}</p>}<div className="adminOrders">{orders.map((order) => <article className="adminOrder" key={order.id}><div className="adminOrderHeading"><div><strong>{order.recipient_name || order.customer_email || "Guest order"}</strong><small>{order.id}</small></div><span>{order.status}</span></div><p>{order.shipping_line1}{order.shipping_line2 ? `, ${order.shipping_line2}` : ""}<br />{order.shipping_city}, {order.shipping_region} {order.shipping_postal_code}</p><div className="adminOrderTotals"><span>Subtotal {money(order.subtotal_cents)}</span><span>Shipping {money(order.shipping_cents)}</span><span>Tax {money(order.tax_cents)}</span><strong>Total {money(order.total_cents)}</strong></div>{order.status === "PAID" && <div className="adminFulfill"><input placeholder="Carrier (UPS or USPS)" value={shipping[order.id]?.carrier || ""} onChange={(event) => setShipping((current) => ({ ...current, [order.id]: { ...current[order.id], carrier: event.target.value } }))} /><input placeholder="Tracking number" value={shipping[order.id]?.trackingNumber || ""} onChange={(event) => setShipping((current) => ({ ...current, [order.id]: { ...current[order.id], trackingNumber: event.target.value } }))} /><button className="btn primary" type="button" onClick={() => fulfill(order)}>Mark fulfilled</button></div>}</article>)}</div></div></div></div></section>;
}

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_STOREFRONT_API_URL || "";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') { value += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(value); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value); value = "";
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
    } else value += char;
  }
  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  if (rows.length < 2) throw new Error("The CSV needs a header and at least one inventory row.");
  const headers = rows[0].map((header) => header.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
  return rows.slice(1).map((cells) => Object.fromEntries(headers.map((header, index) => [header, (cells[index] ?? "").trim()])));
}

export default function AdminInventory() {
  const [token, setToken] = useState("");
  const [ownerId, setOwnerId] = useState("owner_store");
  const [filename, setFilename] = useState("");
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const preview = useMemo(() => rows.slice(0, 8), [rows]);

  async function readFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage("");
    setFilename(file.name);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setRows([]);
      setMessage("CSV is enabled first. Excel and PDF intake will enter the review pipeline in a later phase.");
      return;
    }
    try { setRows(parseCsv(await file.text())); }
    catch (error) { setRows([]); setMessage(error.message); }
  }

  async function upload(event) {
    event.preventDefault();
    if (!token || !rows.length) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`${API}/api/admin/inventory/import`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ ownerId, filename, rows }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Inventory could not be uploaded.");
      setMessage(`Batch ${result.batchId}: ${result.acceptedRows} accepted, ${result.rejectedRows} need correction. All accepted rows remain drafts until reviewed and published.`);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  return <section className="hero heroCardStandard adminInventoryShell"><div className="heroBg heroBgBack" aria-hidden="true" /><div className="heroBg heroBgFront" aria-hidden="true" /><div className="adminInventoryScroller"><div className="adminInventoryPanel"><header><p className="eyebrow">Private administration</p><h1>Inventory intake</h1><p>Upload a CSV, review its normalized rows, and create draft inventory. Nothing becomes purchasable automatically.</p></header><form onSubmit={upload} className="adminInventoryForm"><label>Administrator token<input type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} required /></label><label>Inventory owner ID<input value={ownerId} onChange={(event) => setOwnerId(event.target.value)} required /></label><label>Inventory CSV<input type="file" accept=".csv,text/csv,.xlsx,.xls,.pdf" onChange={readFile} required /></label>{rows.length > 0 && <div className="adminPreview"><h2>Preview ({rows.length} rows)</h2><div className="adminPreviewTable"><table><thead><tr>{Object.keys(preview[0] || {}).map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{preview.map((row, index) => <tr key={index}>{Object.keys(preview[0] || {}).map((header) => <td key={header}>{row[header]}</td>)}</tr>)}</tbody></table></div></div>}{message && <p role="status" className="adminMessage">{message}</p>}<div className="adminActions"><button className="btn primary" type="submit" disabled={busy || !rows.length || !token}>{busy ? "Uploading…" : "Create draft batch"}</button><Link className="btn" to="/admin/orders">Orders</Link><Link className="btn" to="/shop">Return to shop</Link></div></form></div></div></section>;
}

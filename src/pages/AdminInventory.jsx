import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import readXlsxFile from "read-excel-file/browser";

const API = import.meta.env.VITE_STOREFRONT_API_URL || "https://crystal-intel-amazon-beta.chris-waldron319-a01.workers.dev";

const normalizeHeader = (header) => String(header ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

function tableRows(values) {
  if (values.length < 2) throw new Error("The file needs a header and at least one inventory row.");
  const headers = values[0].map(normalizeHeader);
  if (headers.some((header) => !header)) throw new Error("Every inventory column needs a header.");
  return values.slice(1).filter((cells) => cells.some((cell) => String(cell ?? "").trim())).map((cells) => Object.fromEntries(headers.map((header, index) => [header, String(cells[index] ?? "").trim()])));
}

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
  return tableRows(rows);
}

export default function AdminInventory() {
  const [token, setToken] = useState("");
  const [ownerId, setOwnerId] = useState("owner_store");
  const [filename, setFilename] = useState("");
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sourceKind, setSourceKind] = useState("CSV");
  const [batchId, setBatchId] = useState("");
  const [listings, setListings] = useState([]);
  const [selected, setSelected] = useState([]);
  const [errors, setErrors] = useState([]);
  const preview = useMemo(() => rows.slice(0, 8), [rows]);

  async function readFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage("");
    setFilename(file.name);
    const extension = file.name.toLowerCase().split(".").pop();
    if (extension === "pdf") { setRows([]); setMessage("PDF files require manual review and are not imported automatically yet."); return; }
    try {
      if (extension === "csv") { setSourceKind("CSV"); setRows(parseCsv(await file.text())); }
      else if (extension === "xlsx" || extension === "xls") { setSourceKind(extension.toUpperCase()); setRows(tableRows(await readXlsxFile(file))); }
      else throw new Error("Choose a CSV, XLSX, or XLS inventory file.");
    }
    catch (error) { setRows([]); setMessage(error.message); }
  }

  async function loadBatch(id, authToken = token) {
    const response = await fetch(`${API}/api/admin/inventory/listings?batchId=${encodeURIComponent(id)}`, { headers: { authorization: `Bearer ${authToken}` } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Draft inventory could not be loaded.");
    setBatchId(id); setListings(result.listings || []); setSelected((result.listings || []).filter((item) => item.quantity > 0 && item.price_cents !== null).map((item) => item.id));
  }

  async function upload(event) {
    event.preventDefault();
    if (!token || !rows.length) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`${API}/api/admin/inventory/import`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ ownerId, filename, sourceKind, rows }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Inventory could not be uploaded.");
      setErrors(result.errors || []);
      await loadBatch(result.batchId);
      setMessage(`Batch ${result.batchId}: ${result.acceptedRows} accepted, ${result.rejectedRows} need correction. All accepted rows remain drafts until reviewed and published.`);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  async function publishSelected() {
    if (!selected.length || !window.confirm(`Publish ${selected.length} selected listing(s) to the live shop?`)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`${API}/api/admin/inventory/publish`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ listingIds: selected }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Listings could not be published.");
      await loadBatch(batchId);
      setMessage(`${result.updated} listing(s) published. Checkout remains disabled until tax and production Square are approved.`);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  return <section className="hero heroCardStandard adminInventoryShell"><div className="heroBg heroBgBack" aria-hidden="true" /><div className="heroBg heroBgFront" aria-hidden="true" /><div className="adminInventoryScroller"><div className="adminInventoryPanel"><header><p className="eyebrow">Private administration</p><h1>Inventory intake</h1><p>Upload CSV or Excel inventory, review normalized drafts, then deliberately publish selected listings. PDF remains manual-review only.</p></header><form onSubmit={upload} className="adminInventoryForm"><label>Administrator token<input type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} required /></label><label>Inventory owner ID<input value={ownerId} onChange={(event) => setOwnerId(event.target.value)} required /><small>Use owner_store for store-owned inventory. Consignors receive their own owner ID.</small></label><label>Inventory file<input type="file" accept=".csv,text/csv,.xlsx,.xls,.pdf" onChange={readFile} required /></label>{rows.length > 0 && <div className="adminPreview"><h2>File preview ({rows.length} rows)</h2><div className="adminPreviewTable"><table><thead><tr>{Object.keys(preview[0] || {}).map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{preview.map((row, index) => <tr key={index}>{Object.keys(preview[0] || {}).map((header) => <td key={header}>{row[header]}</td>)}</tr>)}</tbody></table></div></div>}{errors.length > 0 && <div className="adminMessage"><strong>Rows requiring correction</strong><ul>{errors.map((error) => <li key={`${error.row}-${error.error}`}>Row {error.row}: {error.error}</li>)}</ul></div>}{message && <p role="status" className="adminMessage">{message}</p>}<div className="adminActions"><button className="btn primary" type="submit" disabled={busy || !rows.length || !token}>{busy ? "Working…" : "Create draft batch"}</button><Link className="btn" to="/admin/orders">Orders</Link><Link className="btn" to="/shop">Return to shop</Link></div></form>{listings.length > 0 && <section className="adminPreview"><div className="sectionTitle"><div><p className="eyebrow">Draft batch</p><h2>Review before publishing</h2></div><span>{selected.length} selected</span></div><div className="adminPreviewTable"><table><thead><tr><th><input type="checkbox" aria-label="Select all drafts" checked={selected.length === listings.length} onChange={(event) => setSelected(event.target.checked ? listings.map((item) => item.id) : [])} /></th><th>SKU</th><th>Game</th><th>Type</th><th>Product</th><th>Set</th><th>Condition</th><th>Qty</th><th>Price</th><th>Status</th></tr></thead><tbody>{listings.map((item) => <tr key={item.id}><td><input type="checkbox" aria-label={`Select ${item.sku}`} checked={selected.includes(item.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /></td><td>{item.sku}</td><td>{item.game_key}</td><td>{item.item_type}</td><td>{item.product_name}</td><td>{item.set_name || item.set_code || "—"}</td><td>{item.card_condition || "—"}</td><td>{item.quantity}</td><td>${(Number(item.price_cents || 0) / 100).toFixed(2)}</td><td>{item.status}</td></tr>)}</tbody></table></div><div className="adminActions"><button className="btn primary" type="button" disabled={busy || !selected.length} onClick={publishSelected}>Publish selected listings</button></div></section>}</div></div></section>;
}

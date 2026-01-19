import React, { useMemo, useState } from 'react'
import { INVENTORY, TCGS, badgeForType, groupBySet, isSealed } from '../data/inventory'

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? 'chip chip--active' : 'chip'}
    >
      {children}
    </button>
  )
}

function Card({ item }) {
  const sealed = isSealed(item)
  const badge = badgeForType(item)

  return (
    <div className="itemCard">
      <div className="itemCard__top">
        <div className="itemCard__title">
          <div className="itemCard__name">{item.name}</div>
          <div className="itemCard__meta">
            <span className="badge">{badge}</span>
            <span className="dot" />
            <span className="muted">{item.tcgLabel}</span>
            {item.set ? (
              <>
                <span className="dot" />
                <span className="muted">{item.set}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="price">${item.price.toFixed(2)}</div>
      </div>

      <div className="itemCard__body">
        <div className="grid2">
          <div>
            <div className="k">Variant</div>
            <div className="v">{item.variant || '—'}</div>
          </div>
          <div>
            <div className="k">Condition</div>
            <div className="v">{item.condition || 'NM'}</div>
          </div>
          <div>
            <div className="k">SKU</div>
            <div className="v mono">{item.sku}</div>
          </div>
          <div>
            <div className="k">Qty</div>
            <div className="v">{item.qty}</div>
          </div>
        </div>

        {sealed ? (
          <div className="note">
            Sealed limit: <strong>2/day per item (SKU)</strong> per account.
          </div>
        ) : (
          <div className="note">Singles have no per-item daily limit.</div>
        )}

        <div className="itemCard__actions">
          <button className="btn btn--primary" type="button" disabled>
            Add to cart (coming soon)
          </button>
          <button className="btn" type="button" disabled>
            Make offer (coming soon)
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Inventory() {
  const [tcg, setTcg] = useState('pokemon')
  const [query, setQuery] = useState('')
  const [showSealedOnly, setShowSealedOnly] = useState(false)

  const items = useMemo(() => {
    const tcgLabel = TCGS.find((t) => t.key === tcg)?.label || tcg

    return INVENTORY
      .filter((x) => x.tcg === tcg)
      .map((x) => ({ ...x, tcgLabel }))
      .filter((x) => {
        if (showSealedOnly && !isSealed(x)) return false
        if (!query.trim()) return true
        const q = query.trim().toLowerCase()
        return (
          x.name.toLowerCase().includes(q) ||
          (x.set || '').toLowerCase().includes(q) ||
          (x.sku || '').toLowerCase().includes(q) ||
          (x.variant || '').toLowerCase().includes(q)
        )
      })
  }, [tcg, query, showSealedOnly])

  const grouped = useMemo(() => groupBySet(items), [items])

  return (
    <div className="stack" style={{ gap: 18 }}>
      <header className="pageHeader">
        <h1 className="pageTitle">Inventory</h1>
        <p className="muted">
          This is a storefront preview. Checkout + live market pricing will be enabled as we wire payments,
          inventory sync, and tax/shipping automation.
        </p>
      </header>

      <section className="panel">
        <div className="row row--wrap" style={{ gap: 10 }}>
          <div className="row row--wrap" style={{ gap: 8 }}>
            {TCGS.map((t) => (
              <Chip key={t.key} active={tcg === t.key} onClick={() => setTcg(t.key)}>
                {t.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="row row--wrap" style={{ marginTop: 12, gap: 10 }}>
          <input
            className="input"
            placeholder="Search by name, set, SKU, or variant…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <label className="toggle">
            <input
              type="checkbox"
              checked={showSealedOnly}
              onChange={(e) => setShowSealedOnly(e.target.checked)}
            />
            <span>Sealed only</span>
          </label>

          <div className="spacer" />

          <div className="muted" style={{ whiteSpace: 'nowrap' }}>
            Showing <strong>{items.length}</strong> item(s)
          </div>
        </div>
      </section>

      {grouped.map(([setName, setItems]) => (
        <section key={setName} className="stack" style={{ gap: 10 }}>
          <div className="sectionTitle">
            <h2>{setName}</h2>
            <div className="muted">{setItems.length} item(s)</div>
          </div>

          <div className="gridCards">
            {setItems.map((it) => (
              <Card key={it.sku} item={it} />
            ))}
          </div>
        </section>
      ))}

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Next steps (when you’re ready)</h2>
        <ul className="list">
          <li>Upload your real inventory (CSV) and we’ll generate catalog + set tabs automatically.</li>
          <li>Enable checkout with Stripe/PayPal and configure shipping rules ($5 singles/$15 sealed, free $100+).</li>
          <li>Add bot protection + purchase limits (sealed only) at account + email + address level.</li>
        </ul>
      </section>
    </div>
  )
}

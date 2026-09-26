PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS inventory_owners (
  id TEXT PRIMARY KEY,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('STORE','CONSIGNOR')),
  display_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  commission_basis_points INTEGER NOT NULL DEFAULT 0 CHECK (commission_basis_points BETWEEN 0 AND 10000),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED','CLOSED')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_import_batches (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES inventory_owners(id),
  source_kind TEXT NOT NULL CHECK (source_kind IN ('CSV','XLSX','XLS','PDF','MANUAL','API')),
  original_filename TEXT,
  file_sha256 TEXT,
  status TEXT NOT NULL DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED','PARSING','NEEDS_REVIEW','APPROVED','IMPORTED','FAILED')),
  total_rows INTEGER NOT NULL DEFAULT 0,
  accepted_rows INTEGER NOT NULL DEFAULT 0,
  rejected_rows INTEGER NOT NULL DEFAULT 0,
  error_summary TEXT,
  created_at TEXT NOT NULL,
  approved_at TEXT,
  imported_at TEXT
);

CREATE TABLE IF NOT EXISTS inventory_listings (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES inventory_owners(id),
  import_batch_id TEXT REFERENCES inventory_import_batches(id),
  ownership TEXT NOT NULL CHECK (ownership IN ('STORE_OWNED','CONSIGNMENT')),
  game_key TEXT NOT NULL,
  catalog_set_id TEXT,
  catalog_card_id TEXT,
  sku TEXT NOT NULL UNIQUE,
  item_type TEXT NOT NULL CHECK (item_type IN ('SEALED','SINGLE','OTHER')),
  product_name TEXT NOT NULL,
  set_code TEXT,
  set_name TEXT,
  collector_number TEXT,
  variant TEXT,
  card_condition TEXT,
  language TEXT DEFAULT 'English',
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  price_cents INTEGER CHECK (price_cents IS NULL OR price_cents >= 0),
  minimum_price_cents INTEGER CHECK (minimum_price_cents IS NULL OR minimum_price_cents >= 0),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','RESERVED','SOLD_OUT','RETURNED','ARCHIVED')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS inventory_listings_owner_idx ON inventory_listings(owner_id, status);
CREATE INDEX IF NOT EXISTS inventory_listings_catalog_idx ON inventory_listings(game_key, set_code, collector_number);
CREATE INDEX IF NOT EXISTS inventory_listings_storefront_idx ON inventory_listings(status, item_type, game_key);

CREATE TABLE IF NOT EXISTS inventory_ledger (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES inventory_listings(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('IMPORT','ADJUSTMENT','RESERVATION','RESERVATION_RELEASE','SALE','RETURN','CONSIGNOR_RETURN')),
  quantity_delta INTEGER NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  external_order_id TEXT,
  sales_channel TEXT NOT NULL DEFAULT 'WEBSITE',
  status TEXT NOT NULL CHECK (status IN ('PENDING','PAID','FULFILLED','REFUNDED','CANCELLED')),
  subtotal_cents INTEGER NOT NULL,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  paid_at TEXT
);

CREATE TABLE IF NOT EXISTS sale_lines (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id),
  listing_id TEXT NOT NULL REFERENCES inventory_listings(id),
  owner_id TEXT NOT NULL REFERENCES inventory_owners(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL,
  gross_cents INTEGER NOT NULL,
  commission_basis_points INTEGER NOT NULL,
  store_fee_cents INTEGER NOT NULL,
  owner_proceeds_cents INTEGER NOT NULL,
  ownership TEXT NOT NULL CHECK (ownership IN ('STORE_OWNED','CONSIGNMENT'))
);

CREATE TABLE IF NOT EXISTS consignment_payouts (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES inventory_owners(id),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','APPROVED','PAID','VOID')),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  gross_sales_cents INTEGER NOT NULL,
  store_fees_cents INTEGER NOT NULL,
  payout_cents INTEGER NOT NULL,
  payment_reference TEXT,
  created_at TEXT NOT NULL,
  paid_at TEXT
);

CREATE TABLE IF NOT EXISTS consignment_payout_lines (
  payout_id TEXT NOT NULL REFERENCES consignment_payouts(id),
  sale_line_id TEXT NOT NULL UNIQUE REFERENCES sale_lines(id),
  PRIMARY KEY (payout_id, sale_line_id)
);

INSERT OR IGNORE INTO inventory_owners (
  id, owner_type, display_name, commission_basis_points, status, created_at, updated_at
) VALUES (
  'owner_store', 'STORE', 'The Crystal Card Keep', 0, 'ACTIVE', datetime('now'), datetime('now')
);

PRAGMA foreign_keys = ON;

ALTER TABLE inventory_listings ADD COLUMN unit_weight_ounces REAL CHECK (unit_weight_ounces IS NULL OR unit_weight_ounces >= 0);
ALTER TABLE inventory_listings ADD COLUMN package_length_inches REAL CHECK (package_length_inches IS NULL OR package_length_inches >= 0);
ALTER TABLE inventory_listings ADD COLUMN package_width_inches REAL CHECK (package_width_inches IS NULL OR package_width_inches >= 0);
ALTER TABLE inventory_listings ADD COLUMN package_height_inches REAL CHECK (package_height_inches IS NULL OR package_height_inches >= 0);
ALTER TABLE inventory_listings ADD COLUMN ships_separately INTEGER NOT NULL DEFAULT 0 CHECK (ships_separately IN (0,1));

CREATE TABLE IF NOT EXISTS shipping_package_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  length_inches REAL NOT NULL CHECK (length_inches > 0),
  width_inches REAL NOT NULL CHECK (width_inches > 0),
  height_inches REAL NOT NULL CHECK (height_inches > 0),
  empty_weight_ounces REAL NOT NULL DEFAULT 0 CHECK (empty_weight_ounces >= 0),
  max_item_weight_ounces REAL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shipping_quotes (
  id TEXT PRIMARY KEY,
  checkout_session_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  carrier TEXT NOT NULL,
  service_code TEXT NOT NULL,
  service_name TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  delivery_days_min INTEGER,
  delivery_days_max INTEGER,
  estimated_delivery_date TEXT,
  package_json TEXT NOT NULL,
  destination_postal_code TEXT NOT NULL,
  destination_country TEXT NOT NULL DEFAULT 'US',
  provider_quote_id TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS shipping_quotes_checkout_idx ON shipping_quotes(checkout_session_id, expires_at);

ALTER TABLE sales ADD COLUMN shipping_quote_id TEXT REFERENCES shipping_quotes(id);
ALTER TABLE sales ADD COLUMN shipping_provider TEXT;
ALTER TABLE sales ADD COLUMN shipping_carrier TEXT;
ALTER TABLE sales ADD COLUMN shipping_service_code TEXT;
ALTER TABLE sales ADD COLUMN shipping_service_name TEXT;
ALTER TABLE sales ADD COLUMN shipping_quote_cents INTEGER CHECK (shipping_quote_cents IS NULL OR shipping_quote_cents >= 0);
ALTER TABLE sales ADD COLUMN ship_to_json TEXT;

CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id),
  provider TEXT NOT NULL,
  carrier TEXT NOT NULL,
  service_code TEXT,
  tracking_number TEXT,
  label_cost_cents INTEGER CHECK (label_cost_cents IS NULL OR label_cost_cents >= 0),
  customer_shipping_cents INTEGER NOT NULL CHECK (customer_shipping_cents >= 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','LABEL_PURCHASED','IN_TRANSIT','DELIVERED','VOIDED','EXCEPTION')),
  package_json TEXT NOT NULL,
  label_url TEXT,
  shipped_at TEXT,
  delivered_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS shipments_sale_idx ON shipments(sale_id);
CREATE UNIQUE INDEX IF NOT EXISTS shipments_tracking_idx ON shipments(carrier, tracking_number) WHERE tracking_number IS NOT NULL;

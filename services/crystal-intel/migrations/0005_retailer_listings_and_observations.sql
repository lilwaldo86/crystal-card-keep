PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS catalog_retailer_listings (
  id TEXT PRIMARY KEY,
  catalog_product_id TEXT NOT NULL,
  retailer TEXT NOT NULL,
  external_id TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (catalog_product_id) REFERENCES catalog_products(id),
  UNIQUE (retailer, external_id)
);

CREATE INDEX IF NOT EXISTS idx_catalog_retailer_listings_product
ON catalog_retailer_listings (catalog_product_id, retailer, active);

INSERT OR IGNORE INTO catalog_retailer_listings (
  id,
  catalog_product_id,
  retailer,
  external_id,
  canonical_url,
  currency,
  active,
  created_at,
  updated_at
)
SELECT
  id,
  catalog_product_id,
  retailer,
  external_id,
  canonical_url,
  'USD',
  1,
  created_at,
  updated_at
FROM catalog_retailer_products;

CREATE TABLE IF NOT EXISTS listing_observations (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  availability TEXT NOT NULL CHECK (
    availability IN (
      'IN_STOCK',
      'LIMITED_STOCK',
      'OUT_OF_STOCK',
      'PREORDER',
      'UNAVAILABLE',
      'UNKNOWN'
    )
  ),
  price_cents INTEGER CHECK (price_cents IS NULL OR price_cents >= 0),
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  stock_quantity INTEGER CHECK (
    stock_quantity IS NULL OR stock_quantity >= 0
  ),
  seller_name TEXT,
  source_fingerprint TEXT,
  previous_observation_id TEXT,
  availability_changed INTEGER NOT NULL DEFAULT 0 CHECK (
    availability_changed IN (0, 1)
  ),
  price_changed INTEGER NOT NULL DEFAULT 0 CHECK (
    price_changed IN (0, 1)
  ),
  quantity_changed INTEGER NOT NULL DEFAULT 0 CHECK (
    quantity_changed IN (0, 1)
  ),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES catalog_retailer_listings(id),
  FOREIGN KEY (previous_observation_id) REFERENCES listing_observations(id),
  UNIQUE (listing_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_listing_observations_listing_time
ON listing_observations (listing_id, observed_at DESC, id DESC);

-- Rollback guidance:
-- DROP TABLE listing_observations;
-- DROP TABLE catalog_retailer_listings;
-- The legacy catalog_retailer_products table is not modified by this migration.

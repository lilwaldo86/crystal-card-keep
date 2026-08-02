PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS catalog_product_identifiers (
  id TEXT PRIMARY KEY,
  catalog_product_id TEXT NOT NULL,
  identifier_type TEXT NOT NULL CHECK (
    identifier_type IN (
      'ASIN',
      'UPC',
      'EAN',
      'ISBN',
      'GTIN',
      'MANUFACTURER_SKU'
    )
  ),
  raw_value TEXT NOT NULL,
  normalized_value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (catalog_product_id) REFERENCES catalog_products(id),
  UNIQUE (identifier_type, normalized_value)
);

CREATE INDEX IF NOT EXISTS idx_catalog_product_identifiers_product
ON catalog_product_identifiers (catalog_product_id, identifier_type);

-- Rollback guidance:
-- DROP TABLE catalog_product_identifiers;

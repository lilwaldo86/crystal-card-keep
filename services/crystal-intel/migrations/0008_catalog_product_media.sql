PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS catalog_groups (
  provider TEXT NOT NULL,
  external_group_id TEXT NOT NULL,
  game_key TEXT NOT NULL,
  set_code TEXT,
  set_name TEXT NOT NULL,
  release_date TEXT,
  source_modified_at TEXT,
  synced_at TEXT NOT NULL,
  PRIMARY KEY (provider, external_group_id)
);

CREATE INDEX IF NOT EXISTS catalog_groups_game_idx ON catalog_groups(game_key, release_date DESC, set_name);

CREATE TABLE IF NOT EXISTS catalog_products (
  provider TEXT NOT NULL,
  external_product_id TEXT NOT NULL,
  external_group_id TEXT NOT NULL,
  game_key TEXT NOT NULL,
  set_code TEXT,
  set_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  clean_name TEXT,
  item_type TEXT NOT NULL DEFAULT 'OTHER' CHECK (item_type IN ('SEALED','SINGLE','OTHER')),
  collector_number TEXT,
  thumbnail_url TEXT,
  product_url TEXT,
  image_count INTEGER NOT NULL DEFAULT 0,
  source_modified_at TEXT,
  synced_at TEXT NOT NULL,
  PRIMARY KEY (provider, external_product_id),
  FOREIGN KEY (provider, external_group_id) REFERENCES catalog_groups(provider, external_group_id)
);

CREATE INDEX IF NOT EXISTS catalog_products_match_idx ON catalog_products(game_key, set_name, product_name);
CREATE INDEX IF NOT EXISTS catalog_products_set_code_idx ON catalog_products(game_key, set_code, collector_number);

ALTER TABLE inventory_listings ADD COLUMN external_catalog_provider TEXT;
ALTER TABLE inventory_listings ADD COLUMN external_catalog_product_id TEXT;


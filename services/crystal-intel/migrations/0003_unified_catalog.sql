PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS catalog_games (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS catalog_products (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  release_date TEXT,
  image_url TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES catalog_games(id)
);

CREATE INDEX IF NOT EXISTS idx_catalog_products_game
ON catalog_products (game_id, active, name);

CREATE TABLE IF NOT EXISTS catalog_retailer_products (
  id TEXT PRIMARY KEY,
  catalog_product_id TEXT NOT NULL,
  retailer TEXT NOT NULL,
  external_id TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (catalog_product_id) REFERENCES catalog_products(id),
  UNIQUE (retailer, external_id)
);

CREATE INDEX IF NOT EXISTS idx_catalog_retailer_products_catalog_product
ON catalog_retailer_products (catalog_product_id, retailer);

INSERT OR IGNORE INTO catalog_games (id, slug, name)
VALUES
  ('pokemon', 'pokemon', 'Pokémon'),
  ('one-piece', 'one-piece', 'One Piece'),
  ('gundam', 'gundam', 'Gundam'),
  ('magic-the-gathering', 'magic-the-gathering', 'Magic: The Gathering'),
  ('dragon-ball-super', 'dragon-ball-super', 'Dragon Ball Super'),
  ('dragon-ball-fusion-world', 'dragon-ball-fusion-world', 'Dragon Ball Fusion World'),
  ('union-arena', 'union-arena', 'Union Arena');

-- Rollback guidance:
-- DROP TABLE catalog_retailer_products;
-- DROP TABLE catalog_products;
-- DROP TABLE catalog_games;

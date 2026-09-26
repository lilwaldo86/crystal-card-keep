PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS catalog_media_sources (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  provider_url TEXT,
  rights_status TEXT NOT NULL DEFAULT 'REFERENCE_ONLY'
    CHECK (rights_status IN ('REFERENCE_ONLY','REQUESTED','APPROVED','EXPIRED','REVOKED')),
  approved_scope TEXT,
  documentation_url TEXT,
  requested_at TEXT,
  approved_at TEXT,
  expires_at TEXT,
  confirmed_by TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO catalog_media_sources (
  id, display_name, provider_url, rights_status, notes, created_at, updated_at
) VALUES (
  'tcgcsv-tcgplayer',
  'TCGCSV cached TCGplayer catalog',
  'https://tcgcsv.com/docs',
  'REFERENCE_ONLY',
  'Metadata and image URLs retained for internal matching only. Not approved for storefront display.',
  datetime('now'), datetime('now')
);

ALTER TABLE storefront_catalog_products ADD COLUMN media_source_id TEXT REFERENCES catalog_media_sources(id);
UPDATE storefront_catalog_products SET media_source_id='tcgcsv-tcgplayer' WHERE provider='tcgcsv-tcgplayer';

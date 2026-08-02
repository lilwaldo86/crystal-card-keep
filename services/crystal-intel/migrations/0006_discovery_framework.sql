PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS discovery_runs (
  id TEXT PRIMARY KEY,
  retailer TEXT NOT NULL,
  job_kind TEXT NOT NULL CHECK (job_kind IN ('URL_SCAN')),
  source_url TEXT NOT NULL,
  query TEXT,
  status TEXT NOT NULL CHECK (
    status IN ('RUNNING', 'SUCCEEDED', 'FAILED')
  ),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  candidates_found INTEGER NOT NULL DEFAULT 0 CHECK (
    candidates_found >= 0
  ),
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discovery_runs_retailer_time
ON discovery_runs (retailer, started_at DESC);

CREATE TABLE IF NOT EXISTS discovery_candidates (
  id TEXT PRIMARY KEY,
  discovery_run_id TEXT NOT NULL,
  retailer TEXT NOT NULL,
  external_id TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  title TEXT,
  price_cents INTEGER CHECK (price_cents IS NULL OR price_cents >= 0),
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  availability TEXT NOT NULL,
  source_fingerprint TEXT,
  match_status TEXT NOT NULL CHECK (
    match_status IN ('MATCHED', 'UNMATCHED', 'CONFLICT')
  ),
  matched_catalog_product_id TEXT,
  match_error TEXT,
  review_status TEXT NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (
    review_status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED')
  ),
  reviewed_at TEXT,
  review_notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (discovery_run_id) REFERENCES discovery_runs(id),
  FOREIGN KEY (matched_catalog_product_id) REFERENCES catalog_products(id),
  CHECK (
    (
      match_status = 'MATCHED'
      AND matched_catalog_product_id IS NOT NULL
      AND match_error IS NULL
    )
    OR (
      match_status = 'UNMATCHED'
      AND matched_catalog_product_id IS NULL
      AND match_error IS NULL
    )
    OR (
      match_status = 'CONFLICT'
      AND matched_catalog_product_id IS NULL
      AND match_error IS NOT NULL
    )
  ),
  CHECK (
    (
      review_status = 'PENDING_REVIEW'
      AND reviewed_at IS NULL
    )
    OR (
      review_status IN ('APPROVED', 'REJECTED')
      AND reviewed_at IS NOT NULL
    )
  ),
  UNIQUE (discovery_run_id, retailer, external_id)
);

CREATE INDEX IF NOT EXISTS idx_discovery_candidates_review
ON discovery_candidates (review_status, created_at);

CREATE INDEX IF NOT EXISTS idx_discovery_candidates_identity
ON discovery_candidates (retailer, external_id, match_status);

-- Rollback guidance:
-- DROP TABLE discovery_candidates;
-- DROP TABLE discovery_runs;

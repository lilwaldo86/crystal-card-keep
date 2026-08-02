PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS archive_runs (
  id TEXT PRIMARY KEY,
  window_start TEXT NOT NULL,
  window_end TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('RUNNING', 'SUCCEEDED', 'FAILED')),
  attempt_count INTEGER NOT NULL DEFAULT 1 CHECK (attempt_count >= 1),
  object_count INTEGER NOT NULL DEFAULT 0 CHECK (object_count >= 0),
  record_count INTEGER NOT NULL DEFAULT 0 CHECK (record_count >= 0),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (window_start, window_end)
);

CREATE INDEX IF NOT EXISTS idx_archive_runs_status_time
ON archive_runs (status, window_start DESC);

CREATE TABLE IF NOT EXISTS archive_objects (
  object_key TEXT PRIMARY KEY,
  archive_run_id TEXT NOT NULL,
  dataset TEXT NOT NULL,
  retailer TEXT,
  record_count INTEGER NOT NULL CHECK (record_count >= 0),
  compressed_bytes INTEGER NOT NULL CHECK (compressed_bytes >= 0),
  sha256 TEXT NOT NULL,
  window_start TEXT NOT NULL,
  window_end TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (archive_run_id) REFERENCES archive_runs(id)
);

CREATE INDEX IF NOT EXISTS idx_archive_objects_window
ON archive_objects (window_start, dataset, retailer, object_key);

-- Rollback guidance:
-- DROP TABLE archive_objects;
-- DROP TABLE archive_runs;

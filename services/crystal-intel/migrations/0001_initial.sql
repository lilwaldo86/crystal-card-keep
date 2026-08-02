PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS monitors (
 id TEXT PRIMARY KEY, retailer TEXT NOT NULL, external_id TEXT NOT NULL,
 canonical_url TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1,
 mode TEXT NOT NULL DEFAULT 'HEALTHY', consecutive_blocks INTEGER NOT NULL DEFAULT 0,
 retry_not_before TEXT, lease_until TEXT, last_attempt_at TEXT,
 last_success_at TEXT, last_blocked_at TEXT, last_observation_id TEXT,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 UNIQUE(retailer, external_id)
);
CREATE TABLE IF NOT EXISTS monitor_jobs (
 id TEXT PRIMARY KEY, monitor_id TEXT NOT NULL, job_kind TEXT NOT NULL,
 intended_at TEXT NOT NULL, enqueued_at TEXT NOT NULL, started_at TEXT,
 completed_at TEXT, status TEXT NOT NULL DEFAULT 'QUEUED', attempt_number INTEGER NOT NULL,
 error_code TEXT, error_message TEXT,
 FOREIGN KEY(monitor_id) REFERENCES monitors(id)
);
CREATE INDEX IF NOT EXISTS idx_jobs_monitor_time ON monitor_jobs(monitor_id,intended_at DESC);
CREATE TABLE IF NOT EXISTS observations (
 id TEXT PRIMARY KEY, monitor_id TEXT NOT NULL, job_id TEXT NOT NULL,
 observed_at TEXT NOT NULL, intended_at TEXT NOT NULL, retailer TEXT NOT NULL,
 external_id TEXT NOT NULL, canonical_url TEXT NOT NULL, product_name TEXT,
 price_cents INTEGER, currency TEXT, availability TEXT NOT NULL,
 availability_text TEXT, displayed_remaining_quantity INTEGER, purchase_limit INTEGER,
 sold_by_amazon INTEGER, ships_from_amazon INTEGER, http_status INTEGER,
 response_time_ms INTEGER, response_size_bytes INTEGER,
 response_classification TEXT NOT NULL, page_fingerprint TEXT, worker_colo TEXT,
 phase_offset_seconds INTEGER NOT NULL, scraper_version TEXT NOT NULL,
 availability_changed INTEGER NOT NULL DEFAULT 0, price_changed INTEGER NOT NULL DEFAULT 0,
 seller_changed INTEGER NOT NULL DEFAULT 0, alert_required INTEGER NOT NULL DEFAULT 0,
 previous_observation_id TEXT, created_at TEXT NOT NULL,
 FOREIGN KEY(monitor_id) REFERENCES monitors(id), FOREIGN KEY(job_id) REFERENCES monitor_jobs(id)
);
CREATE INDEX IF NOT EXISTS idx_obs_monitor_time ON observations(monitor_id,observed_at DESC);
CREATE TABLE IF NOT EXISTS alert_events (
 id TEXT PRIMARY KEY, observation_id TEXT NOT NULL, channel TEXT NOT NULL,
 created_at TEXT NOT NULL, submitted_at TEXT, provider_accepted_at TEXT,
 status TEXT NOT NULL, provider_status INTEGER, error_message TEXT,
 FOREIGN KEY(observation_id) REFERENCES observations(id)
);
CREATE TABLE IF NOT EXISTS engineering_notes (
 id TEXT PRIMARY KEY, monitor_id TEXT, observation_id TEXT, category TEXT NOT NULL,
 note TEXT NOT NULL, numeric_value REAL, unit TEXT, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_time ON engineering_notes(category,created_at DESC);

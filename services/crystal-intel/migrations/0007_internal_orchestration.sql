PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS orchestration_jobs (
  id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL CHECK (
    job_type IN ('DISCOVERY_RUN', 'PROCESS_CANDIDATE')
  ),
  entity_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('RUNNING', 'SUCCEEDED', 'FAILED', 'BLOCKED')
  ),
  attempt_count INTEGER NOT NULL DEFAULT 1 CHECK (attempt_count >= 1),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (job_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_orchestration_jobs_status
ON orchestration_jobs (job_type, status, updated_at);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_events_entity
ON audit_events (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_type_time
ON audit_events (event_type, created_at DESC);

-- Rollback guidance:
-- DROP TABLE audit_events;
-- DROP TABLE orchestration_jobs;

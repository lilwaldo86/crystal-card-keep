PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS intelligence_alerts (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  alert_type TEXT NOT NULL CHECK (
    alert_type IN (
      'NEW_LISTING',
      'RESTOCK',
      'PRICE_DECREASE',
      'PRICE_INCREASE'
    )
  ),
  severity TEXT NOT NULL CHECK (severity IN ('INFO', 'HIGH')),
  listing_id TEXT NOT NULL,
  listing_observation_id TEXT NOT NULL,
  previous_observation_id TEXT,
  message TEXT NOT NULL,
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES catalog_retailer_listings(id),
  FOREIGN KEY (listing_observation_id) REFERENCES listing_observations(id),
  FOREIGN KEY (previous_observation_id) REFERENCES listing_observations(id),
  UNIQUE (alert_type, listing_observation_id)
);

CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_listing_time
ON intelligence_alerts (listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_type_time
ON intelligence_alerts (alert_type, created_at DESC);

CREATE TABLE IF NOT EXISTS notification_events (
  id TEXT PRIMARY KEY,
  alert_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('INTERNAL')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'DELIVERED', 'FAILED')
  ),
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered_at TEXT,
  error_message TEXT,
  FOREIGN KEY (alert_id) REFERENCES intelligence_alerts(id),
  UNIQUE (alert_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_notification_events_status
ON notification_events (status, created_at);

-- Rollback guidance:
-- DROP TABLE notification_events;
-- DROP TABLE intelligence_alerts;

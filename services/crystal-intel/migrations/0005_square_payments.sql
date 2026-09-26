PRAGMA foreign_keys = ON;

ALTER TABLE sales ADD COLUMN payment_provider TEXT;
ALTER TABLE sales ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'UNPAID'
  CHECK (payment_status IN ('UNPAID','PENDING','PAID','FAILED','REFUNDED','PARTIALLY_REFUNDED'));
ALTER TABLE sales ADD COLUMN square_payment_id TEXT;
ALTER TABLE sales ADD COLUMN square_order_id TEXT;
ALTER TABLE sales ADD COLUMN payment_updated_at TEXT;

CREATE TABLE IF NOT EXISTS payment_attempts (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id),
  provider TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  provider_payment_id TEXT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('CREATED','PENDING','COMPLETED','FAILED','CANCELLED','REFUNDED')),
  failure_code TEXT,
  failure_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS payment_attempts_sale_idx ON payment_attempts(sale_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_provider_payment_idx
  ON payment_attempts(provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  signature_verified INTEGER NOT NULL CHECK (signature_verified IN (0,1)),
  payload_json TEXT NOT NULL,
  received_at TEXT NOT NULL,
  processed_at TEXT,
  processing_error TEXT,
  PRIMARY KEY (provider, provider_event_id)
);

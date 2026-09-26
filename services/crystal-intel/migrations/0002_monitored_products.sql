CREATE TABLE IF NOT EXISTS monitored_products (
  id TEXT PRIMARY KEY,
  retailer TEXT NOT NULL,
  external_id TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  priority INTEGER NOT NULL DEFAULT 100,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (retailer, external_id)
);

CREATE INDEX IF NOT EXISTS idx_monitored_products_scheduler
ON monitored_products (retailer, enabled, priority);

INSERT OR IGNORE INTO monitored_products
  (id, retailer, external_id, canonical_url, enabled, priority, created_at, updated_at)
VALUES
  ('amazon-us:B0H7818YHY', 'amazon-us', 'B0H7818YHY', 'https://www.amazon.com/dp/B0H7818YHY', 1, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('amazon-us:B0H783FY5Z', 'amazon-us', 'B0H783FY5Z', 'https://www.amazon.com/dp/B0H783FY5Z', 1, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('amazon-us:B0H7815T4Y', 'amazon-us', 'B0H7815T4Y', 'https://www.amazon.com/dp/B0H7815T4Y', 1, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('amazon-us:B0H78BB9TY', 'amazon-us', 'B0H78BB9TY', 'https://www.amazon.com/dp/B0H78BB9TY', 1, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('amazon-us:B0H7818RCM', 'amazon-us', 'B0H7818RCM', 'https://www.amazon.com/dp/B0H7818RCM', 1, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('amazon-us:B0H788HLPY', 'amazon-us', 'B0H788HLPY', 'https://www.amazon.com/dp/B0H788HLPY', 1, 60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('amazon-us:B0H7FDBNSB', 'amazon-us', 'B0H7FDBNSB', 'https://www.amazon.com/dp/B0H7FDBNSB', 1, 70, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('amazon-us:B0H7F8BHC3', 'amazon-us', 'B0H7F8BHC3', 'https://www.amazon.com/dp/B0H7F8BHC3', 1, 80, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('amazon-us:B0H77W4411', 'amazon-us', 'B0H77W4411', 'https://www.amazon.com/dp/B0H77W4411', 1, 90, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('amazon-us:B0H77VZBX4', 'amazon-us', 'B0H77VZBX4', 'https://www.amazon.com/dp/B0H77VZBX4', 1, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

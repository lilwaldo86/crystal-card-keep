PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customer_accounts (
  id TEXT PRIMARY KEY,
  external_auth_subject TEXT UNIQUE,
  email TEXT NOT NULL,
  normalized_email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED','CLOSED')),
  email_verified_at TEXT,
  marketing_opt_in INTEGER NOT NULL DEFAULT 0 CHECK (marketing_opt_in IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_households (
  id TEXT PRIMARY KEY,
  household_key_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_household_members (
  customer_id TEXT PRIMARY KEY REFERENCES customer_accounts(id),
  household_id TEXT NOT NULL REFERENCES customer_households(id),
  joined_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customer_accounts(id),
  address_type TEXT NOT NULL DEFAULT 'SHIPPING' CHECK (address_type IN ('SHIPPING','BILLING')),
  recipient_name TEXT NOT NULL,
  company TEXT,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  region TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'US',
  phone TEXT,
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS customer_addresses_customer_idx ON customer_addresses(customer_id, address_type);

CREATE TABLE IF NOT EXISTS promotions (
  id TEXT PRIMARY KEY,
  public_name TEXT NOT NULL,
  promotion_type TEXT NOT NULL CHECK (promotion_type IN ('PERCENT','FIXED','REWARD')),
  value INTEGER NOT NULL CHECK (value > 0),
  first_purchase_only INTEGER NOT NULL DEFAULT 0 CHECK (first_purchase_only IN (0,1)),
  max_redemptions_per_customer INTEGER NOT NULL DEFAULT 1 CHECK (max_redemptions_per_customer > 0),
  max_redemptions_per_household INTEGER NOT NULL DEFAULT 4 CHECK (max_redemptions_per_household > 0),
  starts_at TEXT,
  ends_at TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT','ACTIVE','PAUSED','EXPIRED')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS promotion_codes (
  id TEXT PRIMARY KEY,
  promotion_id TEXT NOT NULL REFERENCES promotions(id),
  code_hash TEXT NOT NULL UNIQUE,
  code_last_four TEXT NOT NULL,
  assigned_customer_id TEXT REFERENCES customer_accounts(id),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REDEEMED','REVOKED','EXPIRED')),
  created_at TEXT NOT NULL,
  expires_at TEXT,
  redeemed_at TEXT
);

CREATE TABLE IF NOT EXISTS promotion_redemptions (
  id TEXT PRIMARY KEY,
  promotion_id TEXT NOT NULL REFERENCES promotions(id),
  promotion_code_id TEXT NOT NULL UNIQUE REFERENCES promotion_codes(id),
  customer_id TEXT NOT NULL REFERENCES customer_accounts(id),
  household_id TEXT NOT NULL REFERENCES customer_households(id),
  sale_id TEXT NOT NULL UNIQUE REFERENCES sales(id),
  discount_cents INTEGER NOT NULL CHECK (discount_cents >= 0),
  redeemed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS promotion_redemptions_customer_idx ON promotion_redemptions(promotion_id, customer_id);
CREATE INDEX IF NOT EXISTS promotion_redemptions_household_idx ON promotion_redemptions(promotion_id, household_id);

-- The welcome offer uses four numbered household slots. The primary/unique
-- constraints make a fifth household redemption or a repeated customer/code
-- redemption impossible even if two requests arrive at the same time.
CREATE TABLE IF NOT EXISTS welcome_offer_claims (
  customer_id TEXT PRIMARY KEY REFERENCES customer_accounts(id),
  household_id TEXT NOT NULL REFERENCES customer_households(id),
  household_slot INTEGER NOT NULL CHECK (household_slot BETWEEN 1 AND 4),
  promotion_code_id TEXT NOT NULL UNIQUE REFERENCES promotion_codes(id),
  sale_id TEXT NOT NULL UNIQUE REFERENCES sales(id),
  claimed_at TEXT NOT NULL,
  UNIQUE(household_id, household_slot)
);

INSERT OR IGNORE INTO promotions (
  id, public_name, promotion_type, value, first_purchase_only,
  max_redemptions_per_customer, max_redemptions_per_household,
  status, created_at, updated_at
) VALUES (
  'welcome_first_purchase_5', 'First Purchase 5% Off', 'PERCENT', 500, 1,
  1, 4, 'DRAFT', datetime('now'), datetime('now')
);

CREATE TABLE IF NOT EXISTS reward_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  rank INTEGER NOT NULL UNIQUE,
  minimum_lifetime_spend_cents INTEGER NOT NULL DEFAULT 0,
  points_multiplier_basis_points INTEGER NOT NULL DEFAULT 10000,
  benefits_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO reward_tiers VALUES
  ('tier_keeper','Keeper',1,0,10000,'{"description":"Base member benefits"}','ACTIVE',datetime('now'),datetime('now')),
  ('tier_rare','Rare',2,25000,11000,'{"description":"Enhanced member benefits"}','ACTIVE',datetime('now'),datetime('now')),
  ('tier_mythic','Mythic',3,100000,12500,'{"description":"Top member benefits"}','ACTIVE',datetime('now'),datetime('now'));

CREATE TABLE IF NOT EXISTS reward_accounts (
  customer_id TEXT PRIMARY KEY REFERENCES customer_accounts(id),
  tier_id TEXT NOT NULL REFERENCES reward_tiers(id),
  points_balance INTEGER NOT NULL DEFAULT 0,
  lifetime_points_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_spend_cents INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reward_ledger (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customer_accounts(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('EARN','REDEEM','ADJUST','EXPIRE','REVERSAL')),
  points_delta INTEGER NOT NULL,
  sale_id TEXT REFERENCES sales(id),
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS reward_ledger_customer_idx ON reward_ledger(customer_id, created_at);

CREATE TABLE IF NOT EXISTS catalog_assets (
  id TEXT PRIMARY KEY,
  catalog_item_type TEXT NOT NULL CHECK (catalog_item_type IN ('SET','CARD','SEALED_PRODUCT','LISTING')),
  catalog_item_id TEXT NOT NULL,
  source_url TEXT,
  storage_key TEXT,
  thumbnail_key TEXT,
  media_type TEXT,
  width INTEGER,
  height INTEGER,
  sha256 TEXT,
  source_name TEXT,
  usage_note TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACTIVE','BROKEN','REMOVED')),
  synced_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(catalog_item_type, catalog_item_id, sha256)
);

CREATE INDEX IF NOT EXISTS catalog_assets_item_idx ON catalog_assets(catalog_item_type, catalog_item_id, status);

ALTER TABLE inventory_listings ADD COLUMN primary_asset_id TEXT REFERENCES catalog_assets(id);
ALTER TABLE inventory_listings ADD COLUMN listing_image_url TEXT;

CREATE TABLE IF NOT EXISTS notification_preferences (
  customer_id TEXT PRIMARY KEY REFERENCES customer_accounts(id),
  new_products INTEGER NOT NULL DEFAULT 0 CHECK (new_products IN (0,1)),
  product_launches INTEGER NOT NULL DEFAULT 0 CHECK (product_launches IN (0,1)),
  sales INTEGER NOT NULL DEFAULT 0 CHECK (sales IN (0,1)),
  live_streams INTEGER NOT NULL DEFAULT 0 CHECK (live_streams IN (0,1)),
  weekly_schedule INTEGER NOT NULL DEFAULT 0 CHECK (weekly_schedule IN (0,1)),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notification_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('NEW_PRODUCT','PRODUCT_LIVE','SALE','STREAM','WEEKLY_SCHEDULE')),
  subject TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  scheduled_for TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SCHEDULED','SENDING','SENT','CANCELLED','FAILED')),
  created_at TEXT NOT NULL,
  sent_at TEXT
);

ALTER TABLE sales ADD COLUMN customer_id TEXT REFERENCES customer_accounts(id);
ALTER TABLE sales ADD COLUMN customer_email TEXT;
ALTER TABLE sales ADD COLUMN recipient_name TEXT;
ALTER TABLE sales ADD COLUMN shipping_line1 TEXT;
ALTER TABLE sales ADD COLUMN shipping_line2 TEXT;
ALTER TABLE sales ADD COLUMN shipping_city TEXT;
ALTER TABLE sales ADD COLUMN shipping_region TEXT;
ALTER TABLE sales ADD COLUMN shipping_postal_code TEXT;
ALTER TABLE sales ADD COLUMN shipping_country_code TEXT;
ALTER TABLE sales ADD COLUMN customer_phone TEXT;
ALTER TABLE sales ADD COLUMN discount_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN promotion_code_id TEXT REFERENCES promotion_codes(id);
ALTER TABLE sales ADD COLUMN tax_basis_points INTEGER NOT NULL DEFAULT 0;

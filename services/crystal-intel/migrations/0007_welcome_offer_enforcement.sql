PRAGMA foreign_keys = ON;

-- Kept as its own forward migration so environments that applied an earlier
-- draft of 0006 still receive the database-level household enforcement.
CREATE TABLE IF NOT EXISTS welcome_offer_claims (
  customer_id TEXT PRIMARY KEY REFERENCES customer_accounts(id),
  household_id TEXT NOT NULL REFERENCES customer_households(id),
  household_slot INTEGER NOT NULL CHECK (household_slot BETWEEN 1 AND 4),
  promotion_code_id TEXT NOT NULL UNIQUE REFERENCES promotion_codes(id),
  sale_id TEXT NOT NULL UNIQUE REFERENCES sales(id),
  claimed_at TEXT NOT NULL,
  UNIQUE(household_id, household_slot)
);

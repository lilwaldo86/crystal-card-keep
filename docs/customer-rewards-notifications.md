# Customer, promotion, rewards, and notification foundation

## Account identity

Customer records live in `customer_accounts`, but login credentials must be handled by a dedicated identity provider. The application stores only the provider's stable subject ID. It must never store plaintext passwords.

Verified accounts can own saved addresses, rewards, notification preferences, and order history. Guest checkout can remain available, but claiming rewards or a promotion requires a verified account.

## First-purchase offer

The welcome promotion is created as a draft at 5% (`500` basis points). Codes are stored only as hashes and are individually assigned. The raw code is shown once when issued.

Enforcement is intentionally structural:

- `promotion_codes.code_hash` is unique.
- A code can appear in only one redemption.
- `welcome_offer_claims.customer_id` is the primary key, preventing repeat claims by one customer.
- Each household has four numbered claim slots enforced by `UNIQUE(household_id, household_slot)`.
- The household key should be an HMAC of the normalized deliverable address using a private Worker secret, never a readable address fingerprint.

Promotion redemption must not be enabled until account authentication and household normalization are complete.

## Rewards

The initial draft tiers are Keeper, Rare, and Mythic. Thresholds and multipliers are placeholders for business approval. Every points change belongs in the immutable `reward_ledger`; balances must be derived and reconciled rather than silently overwritten.

Refunded purchases require a points reversal. Tier benefits must be shown before activation and must not promise shipping or discounts the checkout cannot enforce.

## Notifications

Customers opt into categories independently: new products, product launches, sales, live streams, and the weekly schedule. Transactional order messages remain separate from marketing consent.

`notification_events` provides the scheduling queue record, but no campaign is sent automatically yet. Before activation, add verified sending, unsubscribe/suppression handling, audience approval, idempotent delivery records, bounce/complaint webhooks, and frequency controls.

No scheduled marketing email should be enabled merely because a product row was imported. Publishing and campaign approval are separate actions.

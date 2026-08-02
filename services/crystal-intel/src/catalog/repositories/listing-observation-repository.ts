import { detectListingObservationChanges } from "../listing-observation-changes";
import type {
  ListingAvailability,
  ListingObservation,
  RecordListingObservation,
  RecordListingObservationResult,
} from "../types";

interface ListingObservationRow {
  id: string;
  listing_id: string;
  idempotency_key: string;
  observed_at: string;
  availability: ListingAvailability;
  price_cents: number | null;
  currency: string;
  stock_quantity: number | null;
  seller_name: string | null;
  source_fingerprint: string | null;
  previous_observation_id: string | null;
  availability_changed: number;
  price_changed: number;
  quantity_changed: number;
  created_at: string;
}

const selectColumns = `
  id, listing_id, idempotency_key, observed_at, availability,
  price_cents, currency, stock_quantity, seller_name,
  source_fingerprint, previous_observation_id,
  availability_changed, price_changed, quantity_changed, created_at
`;

const toListingObservation = (
  row: ListingObservationRow,
): ListingObservation => ({
  id: row.id,
  listingId: row.listing_id,
  idempotencyKey: row.idempotency_key,
  observedAt: row.observed_at,
  availability: row.availability,
  priceCents: row.price_cents,
  currency: row.currency,
  stockQuantity: row.stock_quantity,
  sellerName: row.seller_name,
  sourceFingerprint: row.source_fingerprint,
  previousObservationId: row.previous_observation_id,
  availabilityChanged: row.availability_changed === 1,
  priceChanged: row.price_changed === 1,
  quantityChanged: row.quantity_changed === 1,
  createdAt: row.created_at,
});

export class ListingObservationRepository {
  constructor(private readonly db: D1Database) {}

  async record(
    input: RecordListingObservation,
  ): Promise<RecordListingObservationResult> {
    const existing = await this.findByIdempotencyKey(
      input.listingId,
      input.idempotencyKey,
    );

    if (existing) {
      return {
        observation: existing,
        created: false,
      };
    }

    const previous = await this.latestForListing(input.listingId);
    const changes = detectListingObservationChanges(previous, input);
    const currency = input.currency.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error(`Invalid observation currency: ${input.currency}`);
    }

    const result = await this.db
      .prepare(
        `INSERT OR IGNORE INTO listing_observations(
           id, listing_id, idempotency_key, observed_at, availability,
           price_cents, currency, stock_quantity, seller_name,
           source_fingerprint, previous_observation_id,
           availability_changed, price_changed, quantity_changed, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.listingId,
        input.idempotencyKey,
        input.observedAt,
        input.availability,
        input.priceCents,
        currency,
        input.stockQuantity ?? null,
        input.sellerName ?? null,
        input.sourceFingerprint ?? null,
        previous?.id ?? null,
        changes.availabilityChanged ? 1 : 0,
        changes.priceChanged ? 1 : 0,
        changes.quantityChanged ? 1 : 0,
        new Date().toISOString(),
      )
      .run();

    const observation = await this.findByIdempotencyKey(
      input.listingId,
      input.idempotencyKey,
    );

    if (!observation) {
      throw new Error(
        `Listing observation unavailable after record: ${input.listingId}:${input.idempotencyKey}`,
      );
    }

    return {
      observation,
      created: (result.meta.changes ?? 0) === 1,
    };
  }

  async findByIdempotencyKey(
    listingId: string,
    idempotencyKey: string,
  ): Promise<ListingObservation | null> {
    const row = await this.db
      .prepare(
        `SELECT ${selectColumns}
         FROM listing_observations
         WHERE listing_id = ? AND idempotency_key = ?`,
      )
      .bind(listingId, idempotencyKey)
      .first<ListingObservationRow>();

    return row ? toListingObservation(row) : null;
  }

  async latestForListing(
    listingId: string,
  ): Promise<ListingObservation | null> {
    const row = await this.db
      .prepare(
        `SELECT ${selectColumns}
         FROM listing_observations
         WHERE listing_id = ?
         ORDER BY observed_at DESC, id DESC
         LIMIT 1`,
      )
      .bind(listingId)
      .first<ListingObservationRow>();

    return row ? toListingObservation(row) : null;
  }

  async listForListing(
    listingId: string,
    limit = 100,
  ): Promise<ListingObservation[]> {
    const boundedLimit = Math.max(1, Math.min(500, limit));
    const result = await this.db
      .prepare(
        `SELECT ${selectColumns}
         FROM listing_observations
         WHERE listing_id = ?
         ORDER BY observed_at DESC, id DESC
         LIMIT ?`,
      )
      .bind(listingId, boundedLimit)
      .all<ListingObservationRow>();

    return result.results.map(toListingObservation);
  }
}

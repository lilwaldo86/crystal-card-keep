import type {
  DiscoveryCandidate,
  DiscoveryMatchStatus,
  DiscoveryReviewStatus,
  RecordDiscoveryCandidate,
  ReviewDiscoveryCandidate,
} from "../types";
import type { RetailerAvailability } from "../../retailers/types";

interface DiscoveryCandidateRow {
  id: string;
  discovery_run_id: string;
  retailer: string;
  external_id: string;
  canonical_url: string;
  title: string | null;
  price_cents: number | null;
  currency: string;
  availability: RetailerAvailability;
  source_fingerprint: string | null;
  match_status: DiscoveryMatchStatus;
  matched_catalog_product_id: string | null;
  match_error: string | null;
  review_status: DiscoveryReviewStatus;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

const selectColumns = `
  id, discovery_run_id, retailer, external_id, canonical_url, title,
  price_cents, currency, availability, source_fingerprint, match_status,
  matched_catalog_product_id, match_error, review_status, reviewed_at,
  review_notes, created_at, updated_at
`;

const toDiscoveryCandidate = (
  row: DiscoveryCandidateRow,
): DiscoveryCandidate => ({
  id: row.id,
  discoveryRunId: row.discovery_run_id,
  retailerId: row.retailer,
  externalId: row.external_id,
  canonicalUrl: row.canonical_url,
  title: row.title,
  priceCents: row.price_cents,
  currency: row.currency,
  availability: row.availability,
  sourceFingerprint: row.source_fingerprint,
  matchStatus: row.match_status,
  matchedCatalogProductId: row.matched_catalog_product_id,
  matchError: row.match_error,
  reviewStatus: row.review_status,
  reviewedAt: row.reviewed_at,
  reviewNotes: row.review_notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class DiscoveryCandidateAlreadyReviewedError extends Error {
  constructor(public readonly candidateId: string) {
    super(`Discovery candidate was already reviewed: ${candidateId}`);
    this.name = "DiscoveryCandidateAlreadyReviewedError";
  }
}

export interface DiscoveryCandidateStore {
  record(input: RecordDiscoveryCandidate): Promise<DiscoveryCandidate>;
}

export class DiscoveryCandidateRepository
  implements DiscoveryCandidateStore
{
  constructor(private readonly db: D1Database) {}

  async record(
    input: RecordDiscoveryCandidate,
  ): Promise<DiscoveryCandidate> {
    const timestamp = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT OR IGNORE INTO discovery_candidates(
           id, discovery_run_id, retailer, external_id, canonical_url,
           title, price_cents, currency, availability, source_fingerprint,
           match_status, matched_catalog_product_id, match_error,
           review_status, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                   'PENDING_REVIEW', ?, ?)`,
      )
      .bind(
        input.id,
        input.discoveryRunId,
        input.retailerId,
        input.externalId,
        input.canonicalUrl,
        input.title,
        input.priceCents,
        input.currency,
        input.availability,
        input.sourceFingerprint,
        input.matchStatus,
        input.matchedCatalogProductId,
        input.matchError,
        timestamp,
        timestamp,
      )
      .run();

    const candidate = await this.findByRunRetailerExternalId(
      input.discoveryRunId,
      input.retailerId,
      input.externalId,
    );

    if (!candidate) {
      throw new Error(
        `Discovery candidate unavailable after record: ${input.discoveryRunId}:${input.retailerId}:${input.externalId}`,
      );
    }

    return candidate;
  }

  async review(
    input: ReviewDiscoveryCandidate,
  ): Promise<DiscoveryCandidate> {
    const result = await this.db
      .prepare(
        `UPDATE discovery_candidates
         SET review_status = ?,
             reviewed_at = ?,
             review_notes = ?,
             updated_at = ?
         WHERE id = ? AND review_status = 'PENDING_REVIEW'`,
      )
      .bind(
        input.decision,
        input.reviewedAt,
        input.notes ?? null,
        input.reviewedAt,
        input.candidateId,
      )
      .run();

    if ((result.meta.changes ?? 0) !== 1) {
      throw new DiscoveryCandidateAlreadyReviewedError(
        input.candidateId,
      );
    }

    return this.requireById(input.candidateId);
  }

  async listPendingReview(
    limit = 100,
  ): Promise<DiscoveryCandidate[]> {
    const boundedLimit = Math.max(1, Math.min(500, limit));
    const result = await this.db
      .prepare(
        `SELECT ${selectColumns}
         FROM discovery_candidates
         WHERE review_status = 'PENDING_REVIEW'
         ORDER BY created_at, id
         LIMIT ?`,
      )
      .bind(boundedLimit)
      .all<DiscoveryCandidateRow>();

    return result.results.map(toDiscoveryCandidate);
  }

  async listApproved(limit = 100): Promise<DiscoveryCandidate[]> {
    const boundedLimit = Math.max(1, Math.min(500, limit));
    const result = await this.db
      .prepare(
        `SELECT ${selectColumns}
         FROM discovery_candidates
         WHERE review_status = 'APPROVED'
         ORDER BY reviewed_at, id
         LIMIT ?`,
      )
      .bind(boundedLimit)
      .all<DiscoveryCandidateRow>();

    return result.results.map(toDiscoveryCandidate);
  }

  async findById(id: string): Promise<DiscoveryCandidate | null> {
    const row = await this.db
      .prepare(
        `SELECT ${selectColumns}
         FROM discovery_candidates
         WHERE id = ?`,
      )
      .bind(id)
      .first<DiscoveryCandidateRow>();

    return row ? toDiscoveryCandidate(row) : null;
  }

  async findByRunRetailerExternalId(
    runId: string,
    retailerId: string,
    externalId: string,
  ): Promise<DiscoveryCandidate | null> {
    const row = await this.db
      .prepare(
        `SELECT ${selectColumns}
         FROM discovery_candidates
         WHERE discovery_run_id = ?
           AND retailer = ?
           AND external_id = ?`,
      )
      .bind(runId, retailerId, externalId)
      .first<DiscoveryCandidateRow>();

    return row ? toDiscoveryCandidate(row) : null;
  }

  private async requireById(id: string): Promise<DiscoveryCandidate> {
    const candidate = await this.findById(id);

    if (!candidate) {
      throw new Error(`Discovery candidate unavailable: ${id}`);
    }

    return candidate;
  }
}

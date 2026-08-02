import assert from "node:assert/strict";
import test from "node:test";

import { AlertEngine } from "../../src/alerts/alert-engine.ts";
import type {
  IntelligenceAlert,
  RecordIntelligenceAlert,
} from "../../src/alerts/types.ts";
import type {
  ListingObservation,
  RecordListingObservation,
  RetailerListing,
  UpsertRetailerListing,
} from "../../src/catalog/types.ts";
import type { DiscoveryCandidate } from "../../src/discovery/types.ts";
import { InternalOrchestrator } from "../../src/orchestration/internal-orchestrator.ts";

const approvedCandidate: DiscoveryCandidate = {
  id: "candidate-integration-1",
  discoveryRunId: "run-integration-1",
  retailerId: "amazon-us",
  externalId: "B0H7818YHY",
  canonicalUrl: "https://www.amazon.com/dp/B0H7818YHY",
  title: "Pokémon Booster Box",
  priceCents: 14999,
  currency: "USD",
  availability: "IN_STOCK",
  sourceFingerprint: "integration-fingerprint",
  matchStatus: "MATCHED",
  matchedCatalogProductId: "product-1",
  matchError: null,
  reviewStatus: "APPROVED",
  reviewedAt: "2026-08-02T12:00:00.000Z",
  reviewNotes: null,
  createdAt: "2026-08-02T11:55:00.000Z",
  updatedAt: "2026-08-02T12:00:00.000Z",
};

class AtomicJobs {
  private readonly claimed = new Set<string>();

  async claim(id: string): Promise<boolean> {
    if (this.claimed.has(id)) return false;
    this.claimed.add(id);
    return true;
  }

  async succeed(): Promise<void> {}
  async fail(): Promise<void> {}
  async block(): Promise<void> {}
}

class MemoryListings {
  readonly records = new Map<string, RetailerListing>();

  async findByRetailerExternalId(
    retailer: string,
    externalId: string,
  ): Promise<RetailerListing | null> {
    return this.records.get(`${retailer}:${externalId}`) ?? null;
  }

  async upsert(input: UpsertRetailerListing): Promise<RetailerListing> {
    const key = `${input.retailer}:${input.externalId}`;
    const listing: RetailerListing = {
      ...input,
      active: input.active ?? true,
      createdAt: "2026-08-02T12:00:00.000Z",
      updatedAt: "2026-08-02T12:00:00.000Z",
    };
    this.records.set(key, listing);
    return listing;
  }
}

class MemoryObservations {
  readonly records = new Map<string, ListingObservation>();

  async latestForListing(listingId: string): Promise<ListingObservation | null> {
    return [...this.records.values()].find((item) => item.listingId === listingId) ?? null;
  }

  async record(input: RecordListingObservation) {
    const existing = this.records.get(input.idempotencyKey);
    if (existing) return { observation: existing, created: false };
    const observation: ListingObservation = {
      id: input.id,
      listingId: input.listingId,
      idempotencyKey: input.idempotencyKey,
      observedAt: input.observedAt,
      availability: input.availability,
      priceCents: input.priceCents,
      currency: input.currency,
      stockQuantity: input.stockQuantity ?? null,
      sellerName: input.sellerName ?? null,
      sourceFingerprint: input.sourceFingerprint ?? null,
      previousObservationId: null,
      availabilityChanged: false,
      priceChanged: false,
      quantityChanged: false,
      createdAt: "2026-08-02T12:00:00.000Z",
    };
    this.records.set(input.idempotencyKey, observation);
    return { observation, created: true };
  }
}

class MemoryAlerts {
  readonly records = new Map<string, IntelligenceAlert>();

  async record(input: RecordIntelligenceAlert): Promise<IntelligenceAlert> {
    const existing = this.records.get(input.idempotencyKey);
    if (existing) return existing;
    const alert: IntelligenceAlert = { ...input };
    this.records.set(input.idempotencyKey, alert);
    return alert;
  }
}

test("approved identity flows through listing, observation, and alert generation", async () => {
  const listings = new MemoryListings();
  const observations = new MemoryObservations();
  const alerts = new MemoryAlerts();
  const orchestrator = new InternalOrchestrator(
    { async execute() { throw new Error("not used"); } },
    { async listApproved() { return [approvedCandidate]; } },
    listings,
    observations,
    new AtomicJobs(),
    { async record() {} },
    undefined,
    new AlertEngine(alerts),
  );

  assert.equal(await orchestrator.processApprovedCandidates(), 1);
  assert.equal(listings.records.size, 1);
  assert.equal(observations.records.size, 1);
  assert.deepEqual([...alerts.records.values()].map((item) => item.alertType), ["NEW_LISTING"]);
});

test("simultaneous candidate replay is claimed and processed exactly once", async () => {
  const listings = new MemoryListings();
  const observations = new MemoryObservations();
  const alerts = new MemoryAlerts();
  const orchestrator = new InternalOrchestrator(
    { async execute() { throw new Error("not used"); } },
    { async listApproved() { return [approvedCandidate]; } },
    listings,
    observations,
    new AtomicJobs(),
    { async record() {} },
    undefined,
    new AlertEngine(alerts),
  );

  const results = await Promise.all(
    Array.from({ length: 50 }, () => orchestrator.processApprovedCandidates()),
  );

  assert.equal(results.reduce((total, result) => total + result, 0), 1);
  assert.equal(listings.records.size, 1);
  assert.equal(observations.records.size, 1);
  assert.equal(alerts.records.size, 1);
});

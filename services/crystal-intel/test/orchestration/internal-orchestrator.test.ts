import assert from "node:assert/strict";
import test from "node:test";

import { InternalOrchestrator } from "../../src/orchestration/internal-orchestrator.ts";
import type {
  ListingObservation,
  RecordListingObservation,
  RetailerListing,
  UpsertRetailerListing,
} from "../../src/catalog/types.ts";
import type {
  DiscoveryCandidate,
  DiscoveryExecutionResult,
  DiscoveryJob,
} from "../../src/discovery/types.ts";
import type { RecordAuditEvent } from "../../src/orchestration/types.ts";

const candidate = (
  overrides: Partial<DiscoveryCandidate> = {},
): DiscoveryCandidate => ({
  id: "candidate-1",
  discoveryRunId: "run-1",
  retailerId: "amazon-us",
  externalId: "B0H7818YHY",
  canonicalUrl: "https://www.amazon.com/dp/B0H7818YHY",
  title: "Pokémon Booster Box",
  priceCents: 14999,
  currency: "USD",
  availability: "UNKNOWN",
  sourceFingerprint: "fingerprint",
  matchStatus: "MATCHED",
  matchedCatalogProductId: "product-1",
  matchError: null,
  reviewStatus: "APPROVED",
  reviewedAt: "2026-07-31T12:00:00.000Z",
  reviewNotes: null,
  createdAt: "2026-07-31T11:00:00.000Z",
  updatedAt: "2026-07-31T12:00:00.000Z",
  ...overrides,
});

class FakeJobs {
  readonly events: string[] = [];

  constructor(private readonly claimed = true) {}

  async claim(): Promise<boolean> {
    this.events.push("claim");
    return this.claimed;
  }

  async succeed(): Promise<void> {
    this.events.push("succeed");
  }

  async fail(): Promise<void> {
    this.events.push("fail");
  }

  async block(): Promise<void> {
    this.events.push("block");
  }
}

class FakeAudits {
  readonly events: RecordAuditEvent[] = [];

  async record(input: RecordAuditEvent): Promise<void> {
    this.events.push(input);
  }
}

class FakeListings {
  readonly upserts: UpsertRetailerListing[] = [];

  constructor(private readonly existing: RetailerListing | null = null) {}

  async findByRetailerExternalId(): Promise<RetailerListing | null> {
    return this.existing;
  }

  async upsert(input: UpsertRetailerListing): Promise<RetailerListing> {
    this.upserts.push(input);
    return {
      ...input,
      active: input.active ?? true,
      createdAt: "2026-07-31T12:00:00.000Z",
      updatedAt: "2026-07-31T12:00:00.000Z",
    };
  }
}

class FakeObservations {
  readonly records: RecordListingObservation[] = [];

  async latestForListing(): Promise<ListingObservation | null> {
    return null;
  }

  async record(input: RecordListingObservation): Promise<{
    observation: ListingObservation;
    created: boolean;
  }> {
    this.records.push(input);
    return {
      created: true,
      observation: {
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
        createdAt: "2026-07-31T12:00:00.000Z",
      },
    };
  }
}

const unusedDiscovery = {
  async execute(
    _job: DiscoveryJob,
  ): Promise<DiscoveryExecutionResult> {
    throw new Error("Not used by candidate tests");
  },
};

test("duplicate discovery claims do not execute the same run twice", async () => {
  let executions = 0;
  const orchestrator = new InternalOrchestrator(
    {
      async execute(
        _job: DiscoveryJob,
      ): Promise<DiscoveryExecutionResult> {
        executions += 1;
        throw new Error("Should not execute");
      },
    },
    {
      async listApproved(): Promise<DiscoveryCandidate[]> {
        return [];
      },
    },
    new FakeListings(),
    new FakeObservations(),
    new FakeJobs(false),
    new FakeAudits(),
  );

  assert.equal(
    await orchestrator.runDiscovery({
      id: "amazon-us:url-scan:2026-07-31T12:05:00.000Z",
      retailerId: "amazon-us",
      kind: "URL_SCAN",
      sourceUrl: "https://www.amazon.com/s?k=trading+card+game",
      query: "trading card game",
    }),
    false,
  );
  assert.equal(executions, 0);
});

test("approved matched candidates create a listing and one observation", async () => {
  const jobs = new FakeJobs();
  const audits = new FakeAudits();
  const listings = new FakeListings();
  const observations = new FakeObservations();
  const orchestrator = new InternalOrchestrator(
    unusedDiscovery,
    {
      async listApproved(): Promise<DiscoveryCandidate[]> {
        return [candidate()];
      },
    },
    listings,
    observations,
    jobs,
    audits,
    {
      next: () => `audit-${audits.events.length + 1}`,
    },
  );

  assert.equal(await orchestrator.processApprovedCandidates(), 1);
  assert.equal(listings.upserts.length, 1);
  assert.equal(observations.records.length, 1);
  assert.equal(
    observations.records[0]?.idempotencyKey,
    "discovery-candidate:candidate-1",
  );
  assert.deepEqual(jobs.events, ["claim", "succeed"]);
  assert.equal(
    audits.events[0]?.eventType,
    "DISCOVERY_CANDIDATE_PROCESSED",
  );
});

test("duplicate candidate claims do not repeat listing work", async () => {
  const jobs = new FakeJobs(false);
  const listings = new FakeListings();
  const observations = new FakeObservations();
  const orchestrator = new InternalOrchestrator(
    unusedDiscovery,
    {
      async listApproved(): Promise<DiscoveryCandidate[]> {
        return [candidate()];
      },
    },
    listings,
    observations,
    jobs,
    new FakeAudits(),
  );

  assert.equal(await orchestrator.processApprovedCandidates(), 0);
  assert.equal(listings.upserts.length, 0);
  assert.equal(observations.records.length, 0);
});

test("unmatched approved candidates are blocked without catalog creation", async () => {
  const jobs = new FakeJobs();
  const listings = new FakeListings();
  const observations = new FakeObservations();
  const audits = new FakeAudits();
  const orchestrator = new InternalOrchestrator(
    unusedDiscovery,
    {
      async listApproved(): Promise<DiscoveryCandidate[]> {
        return [
          candidate({
            matchStatus: "UNMATCHED",
            matchedCatalogProductId: null,
          }),
        ];
      },
    },
    listings,
    observations,
    jobs,
    audits,
  );

  assert.equal(await orchestrator.processApprovedCandidates(), 0);
  assert.deepEqual(jobs.events, ["claim", "block"]);
  assert.equal(listings.upserts.length, 0);
  assert.equal(observations.records.length, 0);
  assert.equal(
    audits.events[0]?.eventType,
    "DISCOVERY_CANDIDATE_BLOCKED",
  );
});

test("existing listing identity conflicts are blocked", async () => {
  const jobs = new FakeJobs();
  const listings = new FakeListings({
    id: "listing-1",
    catalogProductId: "different-product",
    retailer: "amazon-us",
    externalId: "B0H7818YHY",
    canonicalUrl: "https://www.amazon.com/dp/B0H7818YHY",
    currency: "USD",
    active: true,
    createdAt: "2026-07-31T00:00:00.000Z",
    updatedAt: "2026-07-31T00:00:00.000Z",
  });
  const audits = new FakeAudits();
  const orchestrator = new InternalOrchestrator(
    unusedDiscovery,
    {
      async listApproved(): Promise<DiscoveryCandidate[]> {
        return [candidate()];
      },
    },
    listings,
    new FakeObservations(),
    jobs,
    audits,
  );

  assert.equal(await orchestrator.processApprovedCandidates(), 0);
  assert.deepEqual(jobs.events, ["claim", "block"]);
  assert.equal(listings.upserts.length, 0);
  assert.equal(
    audits.events[0]?.eventType,
    "DISCOVERY_CANDIDATE_LINK_CONFLICT",
  );
});

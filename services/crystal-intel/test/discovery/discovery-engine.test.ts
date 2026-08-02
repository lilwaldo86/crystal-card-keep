import assert from "node:assert/strict";
import test from "node:test";

import { DiscoveryEngine } from "../../src/discovery/discovery-engine.ts";
import { RetailerAdapterRegistry } from "../../src/retailers/adapter-registry.ts";
import type {
  NormalizedRetailerPayload,
  RetailerAdapter,
  RetailerDiscoveryItem,
  RetailerDiscoveryRequest,
  RetailerFetchResult,
} from "../../src/retailers/types.ts";
import type {
  DiscoveryCandidate,
  DiscoveryJob,
  DiscoveryRun,
} from "../../src/discovery/types.ts";
import type { DiscoveryCandidateStore } from "../../src/discovery/repositories/discovery-candidate-repository.ts";
import type { DiscoveryRunStore } from "../../src/discovery/repositories/discovery-run-repository.ts";
import type {
  ProductIdentifierCandidate,
  ProductMatch,
} from "../../src/catalog/types.ts";

const job: DiscoveryJob = {
  id: "run-1",
  retailerId: "test-retailer",
  kind: "URL_SCAN",
  sourceUrl: "https://retailer.example/discovery",
  query: "pokemon",
};

const run = (
  status: DiscoveryRun["status"],
  candidatesFound = 0,
): DiscoveryRun => ({
  id: job.id,
  retailerId: job.retailerId,
  jobKind: job.kind,
  sourceUrl: job.sourceUrl,
  query: job.query ?? null,
  status,
  startedAt: "2026-07-31T00:00:00.000Z",
  completedAt:
    status === "RUNNING" ? null : "2026-07-31T00:01:00.000Z",
  candidatesFound,
  errorMessage: null,
  createdAt: "2026-07-31T00:00:00.000Z",
  updatedAt: "2026-07-31T00:00:00.000Z",
});

class FakeAdapter implements RetailerAdapter {
  readonly retailerId = job.retailerId;
  readonly displayName = "Test";
  readonly scraperVersion = "test-v1";
  readonly responseLatencyNoteCategory = "test_latency";

  constructor(private readonly items: RetailerDiscoveryItem[]) {}

  normalizeExternalId(value: string): string {
    return value;
  }

  isValidExternalId(): boolean {
    return true;
  }

  canonicalUrl(externalId: string): string {
    return `https://retailer.example/${externalId}`;
  }

  async fetchListing(): Promise<RetailerFetchResult> {
    throw new Error("Not used by discovery engine test");
  }

  parse(): NormalizedRetailerPayload {
    throw new Error("Not used by discovery engine test");
  }

  async discover(
    _request: RetailerDiscoveryRequest,
  ): Promise<RetailerDiscoveryItem[]> {
    return this.items;
  }
}

class FakeRunStore implements DiscoveryRunStore {
  readonly events: string[] = [];

  async start(): Promise<DiscoveryRun> {
    this.events.push("run:start");
    return run("RUNNING");
  }

  async complete(
    _runId: string,
    _completedAt: string,
    candidatesFound: number,
  ): Promise<DiscoveryRun> {
    this.events.push("run:complete");
    return run("SUCCEEDED", candidatesFound);
  }

  async fail(): Promise<DiscoveryRun> {
    this.events.push("run:fail");
    return run("FAILED");
  }
}

class FakeCandidateStore implements DiscoveryCandidateStore {
  readonly records: DiscoveryCandidate[] = [];

  constructor(private readonly events: string[]) {}

  async record(
    input: Parameters<DiscoveryCandidateStore["record"]>[0],
  ): Promise<DiscoveryCandidate> {
    this.events.push("candidate:record");
    const candidate: DiscoveryCandidate = {
      ...input,
      reviewStatus: "PENDING_REVIEW",
      reviewedAt: null,
      reviewNotes: null,
      createdAt: "2026-07-31T00:00:00.000Z",
      updatedAt: "2026-07-31T00:00:00.000Z",
    };
    this.records.push(candidate);
    return candidate;
  }
}

const discoveryItem: RetailerDiscoveryItem = {
  externalId: "B0H7818YHY",
  canonicalUrl: "https://retailer.example/B0H7818YHY",
  title: "Pokémon Booster Box",
  priceCents: 14999,
  currency: "USD",
  availability: "UNKNOWN",
  identifiers: [
    {
      identifierType: "ASIN",
      value: "B0H7818YHY",
    },
  ],
};

test("matches identity before recording a pending review candidate", async () => {
  const events: string[] = [];
  const adapters = new RetailerAdapterRegistry();
  adapters.register(new FakeAdapter([discoveryItem]));
  const runs = new FakeRunStore();
  const candidates = new FakeCandidateStore(events);
  const matcher = {
    async findMatch(
      identifiers: ProductIdentifierCandidate[],
    ): Promise<ProductMatch> {
      events.push("identity:match");
      assert.deepEqual(identifiers, discoveryItem.identifiers);
      return {
        catalogProductId: "catalog-product-1",
        matchedIdentifiers: [],
      };
    },
  };
  const engine = new DiscoveryEngine(
    adapters,
    matcher,
    runs,
    candidates,
    {
      next: () => "candidate-1",
    },
  );

  const result = await engine.execute(job);

  assert.deepEqual(events, ["identity:match", "candidate:record"]);
  assert.equal(result.run.status, "SUCCEEDED");
  assert.equal(result.candidates[0]?.matchStatus, "MATCHED");
  assert.equal(
    result.candidates[0]?.matchedCatalogProductId,
    "catalog-product-1",
  );
  assert.equal(
    result.candidates[0]?.reviewStatus,
    "PENDING_REVIEW",
  );
});

test("records unmatched discoveries without creating catalog data", async () => {
  const adapters = new RetailerAdapterRegistry();
  adapters.register(new FakeAdapter([discoveryItem]));
  const runs = new FakeRunStore();
  const candidates = new FakeCandidateStore([]);
  const engine = new DiscoveryEngine(
    adapters,
    {
      async findMatch(): Promise<null> {
        return null;
      },
    },
    runs,
    candidates,
    {
      next: () => "candidate-1",
    },
  );

  const result = await engine.execute(job);

  assert.equal(result.candidates[0]?.matchStatus, "UNMATCHED");
  assert.equal(
    result.candidates[0]?.matchedCatalogProductId,
    null,
  );
  assert.equal(
    result.candidates[0]?.reviewStatus,
    "PENDING_REVIEW",
  );
});

test("routes identity conflicts to manual review", async () => {
  const adapters = new RetailerAdapterRegistry();
  adapters.register(new FakeAdapter([discoveryItem]));
  const runs = new FakeRunStore();
  const candidates = new FakeCandidateStore([]);
  const engine = new DiscoveryEngine(
    adapters,
    {
      async findMatch(): Promise<never> {
        throw new Error("Conflicting catalog identities");
      },
    },
    runs,
    candidates,
    {
      next: () => "candidate-1",
    },
  );

  const result = await engine.execute(job);

  assert.equal(result.candidates[0]?.matchStatus, "CONFLICT");
  assert.match(
    result.candidates[0]?.matchError ?? "",
    /Conflicting catalog identities/,
  );
  assert.equal(
    result.candidates[0]?.reviewStatus,
    "PENDING_REVIEW",
  );
});

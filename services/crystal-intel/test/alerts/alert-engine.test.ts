import assert from "node:assert/strict";
import test from "node:test";

import { AlertEngine } from "../../src/alerts/alert-engine.ts";
import type { IntelligenceAlertStore } from "../../src/alerts/repositories/alert-repository.ts";
import type {
  IntelligenceAlert,
  RecordIntelligenceAlert,
} from "../../src/alerts/types.ts";
import type {
  ListingObservation,
  RetailerListing,
} from "../../src/catalog/types.ts";

class MemoryAlertStore implements IntelligenceAlertStore {
  readonly alerts = new Map<string, IntelligenceAlert>();

  async record(
    input: RecordIntelligenceAlert,
  ): Promise<IntelligenceAlert> {
    const existing = this.alerts.get(input.idempotencyKey);

    if (existing) {
      return existing;
    }

    const alert: IntelligenceAlert = input;
    this.alerts.set(input.idempotencyKey, alert);
    return alert;
  }
}

const listing: RetailerListing = {
  id: "listing-1",
  catalogProductId: "product-1",
  retailer: "amazon-us",
  externalId: "B0H7818YHY",
  canonicalUrl: "https://www.amazon.com/dp/B0H7818YHY",
  currency: "USD",
  active: true,
  createdAt: "2026-08-02T12:00:00.000Z",
  updatedAt: "2026-08-02T12:00:00.000Z",
};

const observation = (
  overrides: Partial<ListingObservation> = {},
): ListingObservation => ({
  id: "observation-current",
  listingId: listing.id,
  idempotencyKey: "current",
  observedAt: "2026-08-02T12:05:00.000Z",
  availability: "IN_STOCK",
  priceCents: 4999,
  currency: "USD",
  stockQuantity: null,
  sellerName: null,
  sourceFingerprint: null,
  previousObservationId: "observation-previous",
  availabilityChanged: true,
  priceChanged: false,
  quantityChanged: false,
  createdAt: "2026-08-02T12:05:00.000Z",
  ...overrides,
});

test("generates a new-listing alert for the first listing observation", async () => {
  const engine = new AlertEngine(new MemoryAlertStore());
  const alerts = await engine.evaluate({
    listing,
    observation: observation({
      previousObservationId: null,
      availabilityChanged: false,
    }),
    previousObservation: null,
    isNewListing: true,
  });

  assert.deepEqual(
    alerts.map((alert) => alert.alertType),
    ["NEW_LISTING"],
  );
});

test("detects a restock from an unavailable state", async () => {
  const engine = new AlertEngine(new MemoryAlertStore());
  const alerts = await engine.evaluate({
    listing,
    observation: observation(),
    previousObservation: observation({
      id: "observation-previous",
      availability: "OUT_OF_STOCK",
      priceCents: 4999,
    }),
    isNewListing: false,
  });

  assert.deepEqual(
    alerts.map((alert) => alert.alertType),
    ["RESTOCK"],
  );
  assert.equal(alerts[0]?.severity, "HIGH");
});

test("detects price decreases and increases", async () => {
  const decreaseEngine = new AlertEngine(new MemoryAlertStore());
  const decrease = await decreaseEngine.evaluate({
    listing,
    observation: observation({ priceCents: 3999 }),
    previousObservation: observation({
      id: "observation-previous",
      priceCents: 4999,
    }),
    isNewListing: false,
  });
  const increaseEngine = new AlertEngine(new MemoryAlertStore());
  const increase = await increaseEngine.evaluate({
    listing,
    observation: observation({ priceCents: 5999 }),
    previousObservation: observation({
      id: "observation-previous",
      priceCents: 4999,
    }),
    isNewListing: false,
  });

  assert.equal(decrease[0]?.alertType, "PRICE_DECREASE");
  assert.equal(decrease[0]?.severity, "HIGH");
  assert.equal(increase[0]?.alertType, "PRICE_INCREASE");
  assert.equal(increase[0]?.severity, "INFO");
});

test("does not alert when availability and price are unchanged", async () => {
  const engine = new AlertEngine(new MemoryAlertStore());
  const alerts = await engine.evaluate({
    listing,
    observation: observation({
      availabilityChanged: false,
      priceChanged: false,
    }),
    previousObservation: observation({
      id: "observation-previous",
      availability: "IN_STOCK",
      priceCents: 4999,
    }),
    isNewListing: false,
  });

  assert.deepEqual(alerts, []);
});

test("alert generation is idempotent for the same observation", async () => {
  const store = new MemoryAlertStore();
  const engine = new AlertEngine(store);
  const context = {
    listing,
    observation: observation(),
    previousObservation: observation({
      id: "observation-previous",
      availability: "OUT_OF_STOCK" as const,
    }),
    isNewListing: false,
  };

  const first = await engine.evaluate(context);
  const replay = await engine.evaluate(context);

  assert.equal(store.alerts.size, 1);
  assert.equal(first[0]?.id, replay[0]?.id);
});

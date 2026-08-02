import assert from "node:assert/strict";
import test from "node:test";

import { detectListingObservationChanges } from "../../src/catalog/listing-observation-changes.ts";
import type { RecordListingObservation } from "../../src/catalog/types.ts";

const observation = (
  overrides: Partial<RecordListingObservation> = {},
): RecordListingObservation => ({
  id: "observation-1",
  listingId: "listing-1",
  idempotencyKey: "source-event-1",
  observedAt: "2026-07-31T00:00:00.000Z",
  availability: "IN_STOCK",
  priceCents: 4999,
  currency: "USD",
  stockQuantity: 5,
  ...overrides,
});

test("initial observations do not report changes", () => {
  assert.deepEqual(
    detectListingObservationChanges(null, observation()),
    {
      availabilityChanged: false,
      priceChanged: false,
      quantityChanged: false,
    },
  );
});

test("identical observations do not report changes", () => {
  const previous = observation();

  assert.deepEqual(
    detectListingObservationChanges(previous, observation()),
    {
      availabilityChanged: false,
      priceChanged: false,
      quantityChanged: false,
    },
  );
});

test("availability changes are detected independently", () => {
  assert.deepEqual(
    detectListingObservationChanges(
      observation(),
      observation({
        availability: "OUT_OF_STOCK",
      }),
    ),
    {
      availabilityChanged: true,
      priceChanged: false,
      quantityChanged: false,
    },
  );
});

test("price changes are detected independently", () => {
  assert.deepEqual(
    detectListingObservationChanges(
      observation(),
      observation({
        priceCents: 5999,
      }),
    ),
    {
      availabilityChanged: false,
      priceChanged: true,
      quantityChanged: false,
    },
  );
});

test("quantity changes normalize omitted values to null", () => {
  assert.deepEqual(
    detectListingObservationChanges(
      observation({
        stockQuantity: undefined,
      }),
      observation({
        stockQuantity: null,
      }),
    ),
    {
      availabilityChanged: false,
      priceChanged: false,
      quantityChanged: false,
    },
  );
});

test("multiple changes are detected together", () => {
  assert.deepEqual(
    detectListingObservationChanges(
      observation(),
      observation({
        availability: "LIMITED_STOCK",
        priceCents: 5499,
        stockQuantity: 2,
      }),
    ),
    {
      availabilityChanged: true,
      priceChanged: true,
      quantityChanged: true,
    },
  );
});

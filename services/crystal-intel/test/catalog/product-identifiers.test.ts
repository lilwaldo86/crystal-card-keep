import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidProductIdentifierError,
  normalizeAsin,
  normalizeEan,
  normalizeUpc,
} from "../../src/catalog/product-identifiers.ts";
import {
  ConflictingProductMatchError,
  ProductMatchingService,
} from "../../src/catalog/product-matching-service.ts";
import type { ProductIdentifierLookup } from "../../src/catalog/repositories/product-identifier-repository.ts";
import type {
  ProductIdentifier,
  ProductIdentifierType,
} from "../../src/catalog/types.ts";

const identifier = (
  catalogProductId: string,
  identifierType: ProductIdentifierType,
  normalizedValue: string,
): ProductIdentifier => ({
  id: `${identifierType}:${normalizedValue}`,
  catalogProductId,
  identifierType,
  rawValue: normalizedValue,
  normalizedValue,
  createdAt: "2026-07-31T00:00:00.000Z",
  updatedAt: "2026-07-31T00:00:00.000Z",
});

class MemoryIdentifierLookup implements ProductIdentifierLookup {
  constructor(private readonly values: ProductIdentifier[]) {}

  async findByNormalizedValue(
    identifierType: ProductIdentifierType,
    normalizedValue: string,
  ): Promise<ProductIdentifier | null> {
    return (
      this.values.find(
        (value) =>
          value.identifierType === identifierType &&
          value.normalizedValue === normalizedValue,
      ) ?? null
    );
  }
}

test("normalizes ASIN casing and surrounding whitespace", () => {
  assert.equal(normalizeAsin("  b0h7818yhy "), "B0H7818YHY");
});

test("rejects malformed ASIN values", () => {
  assert.throws(
    () => normalizeAsin("B0H-7818YHY"),
    InvalidProductIdentifierError,
  );
});

test("normalizes valid UPC formatting", () => {
  assert.equal(normalizeUpc("036000-29145 2"), "036000291452");
});

test("rejects an invalid UPC check digit", () => {
  assert.throws(
    () => normalizeUpc("036000291453"),
    InvalidProductIdentifierError,
  );
});

test("normalizes valid EAN formatting", () => {
  assert.equal(normalizeEan("4006381-33393 1"), "4006381333931");
});

test("rejects an invalid EAN check digit", () => {
  assert.throws(
    () => normalizeEan("4006381333932"),
    InvalidProductIdentifierError,
  );
});

test("matches a product through a normalized identifier", async () => {
  const asin = identifier("product-1", "ASIN", "B0H7818YHY");
  const service = new ProductMatchingService(
    new MemoryIdentifierLookup([asin]),
  );

  const result = await service.findMatch([
    {
      identifierType: "ASIN",
      value: " b0h7818yhy ",
    },
  ]);

  assert.equal(result?.catalogProductId, "product-1");
  assert.deepEqual(result?.matchedIdentifiers, [asin]);
});

test("returns no match for unknown identifiers", async () => {
  const service = new ProductMatchingService(
    new MemoryIdentifierLookup([]),
  );

  assert.equal(
    await service.findMatch([
      {
        identifierType: "ASIN",
        value: "B0H7818YHY",
      },
    ]),
    null,
  );
});

test("deduplicates multiple identifiers resolving to one product", async () => {
  const service = new ProductMatchingService(
    new MemoryIdentifierLookup([
      identifier("product-1", "ASIN", "B0H7818YHY"),
      identifier("product-1", "UPC", "036000291452"),
    ]),
  );

  const result = await service.findMatch([
    {
      identifierType: "ASIN",
      value: "B0H7818YHY",
    },
    {
      identifierType: "UPC",
      value: "036000291452",
    },
  ]);

  assert.equal(result?.catalogProductId, "product-1");
  assert.equal(result?.matchedIdentifiers.length, 2);
});

test("rejects identifiers that resolve to different products", async () => {
  const service = new ProductMatchingService(
    new MemoryIdentifierLookup([
      identifier("product-1", "ASIN", "B0H7818YHY"),
      identifier("product-2", "UPC", "036000291452"),
    ]),
  );

  await assert.rejects(
    service.findMatch([
      {
        identifierType: "ASIN",
        value: "B0H7818YHY",
      },
      {
        identifierType: "UPC",
        value: "036000291452",
      },
    ]),
    ConflictingProductMatchError,
  );
});

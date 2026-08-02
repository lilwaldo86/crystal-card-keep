import assert from "node:assert/strict";
import test from "node:test";

import {
  DuplicateRetailerAdapterError,
  RetailerAdapterRegistry,
  UnknownRetailerAdapterError,
} from "../../src/retailers/adapter-registry.ts";
import { AmazonAdapter } from "../../src/retailers/amazon/amazon-adapter.ts";
import {
  matchFirst,
  parsePriceCents,
  stripMarkup,
} from "../../src/retailers/normalization.ts";

test("shared retailer normalization strips markup and entities", () => {
  assert.equal(
    stripMarkup("  <strong>Cards &amp; Games</strong>  "),
    "Cards & Games",
  );
  assert.equal(
    matchFirst("<span> $49.99 </span>", [
      /<span>([\s\S]*?)<\/span>/,
    ]),
    "$49.99",
  );
  assert.equal(parsePriceCents("$1,249.95"), 124995);
});

test("registry returns registered adapters", () => {
  const registry = new RetailerAdapterRegistry();
  const adapter = new AmazonAdapter();

  registry.register(adapter);

  assert.equal(registry.get("amazon-us"), adapter);
  assert.equal(registry.has("amazon-us"), true);
  assert.deepEqual(registry.list(), [adapter]);
});

test("registry rejects duplicate and unknown adapters", () => {
  const registry = new RetailerAdapterRegistry();
  registry.register(new AmazonAdapter());

  assert.throws(
    () => registry.register(new AmazonAdapter()),
    DuplicateRetailerAdapterError,
  );
  assert.throws(
    () => registry.get("unknown"),
    UnknownRetailerAdapterError,
  );
});

test("Amazon adapter normalizes and validates ASINs", () => {
  const adapter = new AmazonAdapter();
  const asin = adapter.normalizeExternalId(" b0h7818yhy ");

  assert.equal(asin, "B0H7818YHY");
  assert.equal(adapter.isValidExternalId(asin), true);
  assert.equal(adapter.isValidExternalId("INVALID"), false);
  assert.equal(
    adapter.canonicalUrl(asin, "www.amazon.com"),
    "https://www.amazon.com/dp/B0H7818YHY",
  );
});

test("Amazon adapter preserves product-page parsing behavior", () => {
  const adapter = new AmazonAdapter();
  const parsed = adapter.parse(
    200,
    `
      <span id="productTitle"> Pokémon &amp; Friends </span>
      <div id="availability">Only 3 left in stock</div>
      <span class="a-offscreen">$49.99</span>
      <div id="merchant-info">
        Ships from Amazon.com and Sold by Amazon.com
      </div>
      <script>{"maxOrderQuantity": 2}</script>
    `,
  );

  assert.deepEqual(parsed, {
    classification: "PRODUCT_PAGE",
    productName: "Pokémon & Friends",
    priceCents: 4999,
    currency: "USD",
    availability: "LIMITED_STOCK",
    availabilityText: "Only 3 left in stock",
    displayedRemainingQuantity: 3,
    purchaseLimit: 2,
    soldByRetailer: true,
    shipsFromRetailer: true,
  });
});

test("Amazon adapter preserves block classifications", () => {
  const adapter = new AmazonAdapter();

  assert.equal(adapter.parse(429, "").classification, "RATE_LIMITED");
  assert.equal(adapter.parse(503, "").classification, "SERVER_ERROR");
  assert.equal(
    adapter.parse(200, "Enter the characters you see below")
      .classification,
    "CAPTCHA",
  );
  assert.equal(adapter.parse(403, "").classification, "BLOCKED");
  assert.equal(
    adapter.parse(200, "<html>Unexpected</html>").classification,
    "UNEXPECTED_PAGE",
  );
});

test("Amazon adapter preserves request headers", async () => {
  const originalFetch = globalThis.fetch;
  let capturedHeaders: HeadersInit | undefined;

  globalThis.fetch = async (
    _input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    capturedHeaders = init?.headers;
    return new Response("<html>ok</html>", {
      status: 200,
    });
  };

  try {
    const result = await new AmazonAdapter().fetchListing(
      "https://www.amazon.com/dp/B0H7818YHY",
    );
    const headers = new Headers(capturedHeaders);

    assert.equal(
      headers.get("accept"),
      "text/html,application/xhtml+xml",
    );
    assert.equal(headers.get("accept-language"), "en-US,en;q=0.9");
    assert.equal(headers.get("cache-control"), "no-cache");
    assert.equal(result.status, 200);
    assert.equal(result.body, "<html>ok</html>");
    assert.equal(result.responseSizeBytes, 15);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Amazon adapter discovers and deduplicates search results", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (): Promise<Response> =>
    new Response(
      `
        <div data-asin="B0H7818YHY">
          <h2><span>Pokémon Booster Box</span></h2>
          <span class="a-offscreen">$149.99</span>
          <a href="/dp/B0H7818YHY">First</a>
        </div>
        <a href="/dp/B0H783FY5Z">Second</a>
        <a href="/dp/B0H783FY5Z">Duplicate second</a>
      `,
      {
        status: 200,
      },
    );

  try {
    const items = await new AmazonAdapter().discover({
      sourceUrl: "https://www.amazon.com/s?k=pokemon",
      query: "pokemon",
    });

    assert.equal(items.length, 2);
    assert.deepEqual(items[0], {
      externalId: "B0H7818YHY",
      canonicalUrl: "https://www.amazon.com/dp/B0H7818YHY",
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
    });
    assert.equal(items[1]?.externalId, "B0H783FY5Z");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  assertRuntimeConfiguration,
  validateRuntimeConfiguration,
} from "../../src/runtime/config.ts";

const valid = () => ({
  AMAZON_MARKETPLACE: "www.amazon.com",
  MONITOR_ENABLED: "true",
  DAILY_PHASE_STEP_SECONDS: "5",
  BASE_BLOCK_RETRY_SECONDS: "30",
  MAX_BLOCK_RETRY_SECONDS: "1800",
  DISCOVERY_ENABLED: "true",
  AMAZON_DISCOVERY_URL: "https://www.amazon.com/s?k=trading+card+game",
  AMAZON_DISCOVERY_QUERY: "trading card game",
});

test("accepts the production-shaped runtime configuration", () => {
  assert.deepEqual(validateRuntimeConfiguration(valid()), {
    valid: true,
    errors: [],
  });
  assert.doesNotThrow(() => assertRuntimeConfiguration(valid()));
});

test("reports invalid booleans, retry bounds, URLs, and empty queries", () => {
  const result = validateRuntimeConfiguration({
    ...valid(),
    MONITOR_ENABLED: "yes",
    DAILY_PHASE_STEP_SECONDS: "60",
    BASE_BLOCK_RETRY_SECONDS: "90",
    MAX_BLOCK_RETRY_SECONDS: "30",
    AMAZON_DISCOVERY_URL: "http://example.com/search",
    AMAZON_DISCOVERY_QUERY: "  ",
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.length, 5);
  assert.throws(() => assertRuntimeConfiguration({ ...valid(), DISCOVERY_ENABLED: "1" }));
});

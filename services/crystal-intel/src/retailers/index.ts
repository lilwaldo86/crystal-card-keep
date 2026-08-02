import { RetailerAdapterRegistry } from "./adapter-registry.ts";
import { AmazonAdapter } from "./amazon/amazon-adapter.ts";

export {
  DuplicateRetailerAdapterError,
  RetailerAdapterRegistry,
  UnknownRetailerAdapterError,
} from "./adapter-registry.ts";
export { AmazonAdapter } from "./amazon/amazon-adapter.ts";
export {
  booleanToInteger,
  matchFirst,
  parsePriceCents,
  sha256,
  stripMarkup,
} from "./normalization.ts";
export type {
  NormalizedRetailerPayload,
  RetailerAdapter,
  RetailerAvailability,
  RetailerDiscoveryIdentifier,
  RetailerDiscoveryItem,
  RetailerDiscoveryRequest,
  RetailerFetchResult,
  RetailerResponseClassification,
} from "./types";

export const retailerAdapters = new RetailerAdapterRegistry();
retailerAdapters.register(new AmazonAdapter());

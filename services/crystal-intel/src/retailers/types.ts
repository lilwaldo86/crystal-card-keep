export type RetailerAvailability =
  | "IN_STOCK"
  | "LIMITED_STOCK"
  | "OUT_OF_STOCK"
  | "PREORDER"
  | "UNAVAILABLE"
  | "UNKNOWN";

export type RetailerResponseClassification =
  | "PRODUCT_PAGE"
  | "BLOCKED"
  | "CAPTCHA"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNEXPECTED_PAGE";

export interface NormalizedRetailerPayload {
  classification: RetailerResponseClassification;
  productName: string | null;
  priceCents: number | null;
  currency: string;
  availability: RetailerAvailability;
  availabilityText: string | null;
  displayedRemainingQuantity: number | null;
  purchaseLimit: number | null;
  soldByRetailer: boolean | null;
  shipsFromRetailer: boolean | null;
}

export interface RetailerFetchResult {
  status: number;
  body: string;
  latencyMs: number;
  responseSizeBytes: number;
  workerColo: string | null;
}

export interface RetailerDiscoveryRequest {
  sourceUrl: string;
  query: string | null;
}

export interface RetailerDiscoveryIdentifier {
  identifierType:
    | "ASIN"
    | "UPC"
    | "EAN"
    | "ISBN"
    | "GTIN"
    | "MANUFACTURER_SKU";
  value: string;
}

export interface RetailerDiscoveryItem {
  externalId: string;
  canonicalUrl: string;
  title: string | null;
  priceCents: number | null;
  currency: string;
  availability: RetailerAvailability;
  identifiers: RetailerDiscoveryIdentifier[];
}

export interface RetailerAdapter {
  readonly retailerId: string;
  readonly displayName: string;
  readonly scraperVersion: string;
  readonly responseLatencyNoteCategory: string;

  normalizeExternalId(value: string): string;
  isValidExternalId(value: string): boolean;
  canonicalUrl(externalId: string, marketplace: string): string;
  fetchListing(url: string): Promise<RetailerFetchResult>;
  parse(status: number, body: string): NormalizedRetailerPayload;
  discover(
    request: RetailerDiscoveryRequest,
  ): Promise<RetailerDiscoveryItem[]>;
}

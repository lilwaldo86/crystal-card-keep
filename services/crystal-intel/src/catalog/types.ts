export type CatalogGameId =
  | "pokemon"
  | "one-piece"
  | "gundam"
  | "magic-the-gathering"
  | "dragon-ball-super"
  | "dragon-ball-fusion-world"
  | "union-arena";

export interface CatalogGame {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogProduct {
  id: string;
  gameId: string;
  name: string;
  productType: string;
  releaseDate: string | null;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCatalogProduct {
  id: string;
  gameId: string;
  name: string;
  productType: string;
  releaseDate?: string | null;
  imageUrl?: string | null;
  active?: boolean;
}

export interface RetailerProduct {
  id: string;
  catalogProductId: string;
  retailer: string;
  externalId: string;
  canonicalUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertRetailerProduct {
  id: string;
  catalogProductId: string;
  retailer: string;
  externalId: string;
  canonicalUrl: string;
}

export type ProductIdentifierType =
  | "ASIN"
  | "UPC"
  | "EAN"
  | "ISBN"
  | "GTIN"
  | "MANUFACTURER_SKU";

export interface ProductIdentifier {
  id: string;
  catalogProductId: string;
  identifierType: ProductIdentifierType;
  rawValue: string;
  normalizedValue: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddProductIdentifier {
  id: string;
  catalogProductId: string;
  identifierType: ProductIdentifierType;
  value: string;
}

export interface ProductIdentifierCandidate {
  identifierType: ProductIdentifierType;
  value: string;
}

export interface ProductMatch {
  catalogProductId: string;
  matchedIdentifiers: ProductIdentifier[];
}

export interface RetailerListing {
  id: string;
  catalogProductId: string;
  retailer: string;
  externalId: string;
  canonicalUrl: string;
  currency: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertRetailerListing {
  id: string;
  catalogProductId: string;
  retailer: string;
  externalId: string;
  canonicalUrl: string;
  currency: string;
  active?: boolean;
}

export type ListingAvailability =
  | "IN_STOCK"
  | "LIMITED_STOCK"
  | "OUT_OF_STOCK"
  | "PREORDER"
  | "UNAVAILABLE"
  | "UNKNOWN";

export interface ListingObservation {
  id: string;
  listingId: string;
  idempotencyKey: string;
  observedAt: string;
  availability: ListingAvailability;
  priceCents: number | null;
  currency: string;
  stockQuantity: number | null;
  sellerName: string | null;
  sourceFingerprint: string | null;
  previousObservationId: string | null;
  availabilityChanged: boolean;
  priceChanged: boolean;
  quantityChanged: boolean;
  createdAt: string;
}

export interface RecordListingObservation {
  id: string;
  listingId: string;
  idempotencyKey: string;
  observedAt: string;
  availability: ListingAvailability;
  priceCents: number | null;
  currency: string;
  stockQuantity?: number | null;
  sellerName?: string | null;
  sourceFingerprint?: string | null;
}

export interface ListingObservationChanges {
  availabilityChanged: boolean;
  priceChanged: boolean;
  quantityChanged: boolean;
}

export interface RecordListingObservationResult {
  observation: ListingObservation;
  created: boolean;
}

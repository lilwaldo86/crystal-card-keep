import type {
  RetailerListing,
  UpsertRetailerListing,
} from "../types";

interface RetailerListingRow {
  id: string;
  catalog_product_id: string;
  retailer: string;
  external_id: string;
  canonical_url: string;
  currency: string;
  active: number;
  created_at: string;
  updated_at: string;
}

const toRetailerListing = (
  row: RetailerListingRow,
): RetailerListing => ({
  id: row.id,
  catalogProductId: row.catalog_product_id,
  retailer: row.retailer,
  externalId: row.external_id,
  canonicalUrl: row.canonical_url,
  currency: row.currency,
  active: row.active === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class RetailerListingRepository {
  constructor(private readonly db: D1Database) {}

  async upsert(input: UpsertRetailerListing): Promise<RetailerListing> {
    const timestamp = new Date().toISOString();
    const currency = input.currency.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error(`Invalid listing currency: ${input.currency}`);
    }

    await this.db
      .prepare(
        `INSERT INTO catalog_retailer_listings(
           id, catalog_product_id, retailer, external_id, canonical_url,
           currency, active, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(retailer, external_id) DO UPDATE SET
           catalog_product_id = excluded.catalog_product_id,
           canonical_url = excluded.canonical_url,
           currency = excluded.currency,
           active = excluded.active,
           updated_at = excluded.updated_at`,
      )
      .bind(
        input.id,
        input.catalogProductId,
        input.retailer,
        input.externalId,
        input.canonicalUrl,
        currency,
        input.active === false ? 0 : 1,
        timestamp,
        timestamp,
      )
      .run();

    const listing = await this.findByRetailerExternalId(
      input.retailer,
      input.externalId,
    );

    if (!listing) {
      throw new Error(
        `Retailer listing unavailable after upsert: ${input.retailer}:${input.externalId}`,
      );
    }

    return listing;
  }

  async findById(id: string): Promise<RetailerListing | null> {
    const row = await this.db
      .prepare(
        `SELECT
           id, catalog_product_id, retailer, external_id, canonical_url,
           currency, active, created_at, updated_at
         FROM catalog_retailer_listings
         WHERE id = ?`,
      )
      .bind(id)
      .first<RetailerListingRow>();

    return row ? toRetailerListing(row) : null;
  }

  async findByRetailerExternalId(
    retailer: string,
    externalId: string,
  ): Promise<RetailerListing | null> {
    const row = await this.db
      .prepare(
        `SELECT
           id, catalog_product_id, retailer, external_id, canonical_url,
           currency, active, created_at, updated_at
         FROM catalog_retailer_listings
         WHERE retailer = ? AND external_id = ?`,
      )
      .bind(retailer, externalId)
      .first<RetailerListingRow>();

    return row ? toRetailerListing(row) : null;
  }

  async listByCatalogProduct(
    catalogProductId: string,
  ): Promise<RetailerListing[]> {
    const result = await this.db
      .prepare(
        `SELECT
           id, catalog_product_id, retailer, external_id, canonical_url,
           currency, active, created_at, updated_at
         FROM catalog_retailer_listings
         WHERE catalog_product_id = ?
         ORDER BY retailer, external_id`,
      )
      .bind(catalogProductId)
      .all<RetailerListingRow>();

    return result.results.map(toRetailerListing);
  }
}

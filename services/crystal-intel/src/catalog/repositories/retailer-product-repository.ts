import type {
  RetailerProduct,
  UpsertRetailerProduct,
} from "../types";

interface RetailerProductRow {
  id: string;
  catalog_product_id: string;
  retailer: string;
  external_id: string;
  canonical_url: string;
  created_at: string;
  updated_at: string;
}

const toRetailerProduct = (
  row: RetailerProductRow,
): RetailerProduct => ({
  id: row.id,
  catalogProductId: row.catalog_product_id,
  retailer: row.retailer,
  externalId: row.external_id,
  canonicalUrl: row.canonical_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class RetailerProductRepository {
  constructor(private readonly db: D1Database) {}

  async upsert(input: UpsertRetailerProduct): Promise<RetailerProduct> {
    const timestamp = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO catalog_retailer_products(
           id, catalog_product_id, retailer, external_id, canonical_url,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(retailer, external_id) DO UPDATE SET
           catalog_product_id = excluded.catalog_product_id,
           canonical_url = excluded.canonical_url,
           updated_at = excluded.updated_at`,
      )
      .bind(
        input.id,
        input.catalogProductId,
        input.retailer,
        input.externalId,
        input.canonicalUrl,
        timestamp,
        timestamp,
      )
      .run();

    const product = await this.findByRetailerExternalId(
      input.retailer,
      input.externalId,
    );

    if (!product) {
      throw new Error(
        `Retailer product unavailable after upsert: ${input.retailer}:${input.externalId}`,
      );
    }

    return product;
  }

  async findByRetailerExternalId(
    retailer: string,
    externalId: string,
  ): Promise<RetailerProduct | null> {
    const row = await this.db
      .prepare(
        `SELECT
           id, catalog_product_id, retailer, external_id, canonical_url,
           created_at, updated_at
         FROM catalog_retailer_products
         WHERE retailer = ? AND external_id = ?`,
      )
      .bind(retailer, externalId)
      .first<RetailerProductRow>();

    return row ? toRetailerProduct(row) : null;
  }

  async listByCatalogProduct(
    catalogProductId: string,
  ): Promise<RetailerProduct[]> {
    const result = await this.db
      .prepare(
        `SELECT
           id, catalog_product_id, retailer, external_id, canonical_url,
           created_at, updated_at
         FROM catalog_retailer_products
         WHERE catalog_product_id = ?
         ORDER BY retailer, external_id`,
      )
      .bind(catalogProductId)
      .all<RetailerProductRow>();

    return result.results.map(toRetailerProduct);
  }
}

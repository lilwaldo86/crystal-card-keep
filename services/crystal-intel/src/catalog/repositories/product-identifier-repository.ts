import { normalizeProductIdentifier } from "../product-identifiers";
import type {
  AddProductIdentifier,
  ProductIdentifier,
  ProductIdentifierType,
} from "../types";

interface ProductIdentifierRow {
  id: string;
  catalog_product_id: string;
  identifier_type: ProductIdentifierType;
  raw_value: string;
  normalized_value: string;
  created_at: string;
  updated_at: string;
}

const toProductIdentifier = (
  row: ProductIdentifierRow,
): ProductIdentifier => ({
  id: row.id,
  catalogProductId: row.catalog_product_id,
  identifierType: row.identifier_type,
  rawValue: row.raw_value,
  normalizedValue: row.normalized_value,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class DuplicateProductIdentifierError extends Error {
  constructor(
    public readonly existing: ProductIdentifier,
    public readonly requestedCatalogProductId: string,
  ) {
    super(
      `${existing.identifierType} ${existing.normalizedValue} already belongs to catalog product ${existing.catalogProductId}`,
    );
    this.name = "DuplicateProductIdentifierError";
  }
}

export interface ProductIdentifierLookup {
  findByNormalizedValue(
    identifierType: ProductIdentifierType,
    normalizedValue: string,
  ): Promise<ProductIdentifier | null>;
}

export class ProductIdentifierRepository
  implements ProductIdentifierLookup
{
  constructor(private readonly db: D1Database) {}

  async add(input: AddProductIdentifier): Promise<ProductIdentifier> {
    const normalizedValue = normalizeProductIdentifier(
      input.identifierType,
      input.value,
    );
    const existing = await this.findByNormalizedValue(
      input.identifierType,
      normalizedValue,
    );

    if (existing) {
      if (existing.catalogProductId !== input.catalogProductId) {
        throw new DuplicateProductIdentifierError(
          existing,
          input.catalogProductId,
        );
      }

      return existing;
    }

    const timestamp = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO catalog_product_identifiers(
           id, catalog_product_id, identifier_type, raw_value,
           normalized_value, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.catalogProductId,
        input.identifierType,
        input.value,
        normalizedValue,
        timestamp,
        timestamp,
      )
      .run();

    const identifier = await this.findByNormalizedValue(
      input.identifierType,
      normalizedValue,
    );

    if (!identifier) {
      throw new Error(
        `Product identifier unavailable after insert: ${input.identifierType}:${normalizedValue}`,
      );
    }

    return identifier;
  }

  async findByNormalizedValue(
    identifierType: ProductIdentifierType,
    normalizedValue: string,
  ): Promise<ProductIdentifier | null> {
    const row = await this.db
      .prepare(
        `SELECT
           id, catalog_product_id, identifier_type, raw_value,
           normalized_value, created_at, updated_at
         FROM catalog_product_identifiers
         WHERE identifier_type = ? AND normalized_value = ?`,
      )
      .bind(identifierType, normalizedValue)
      .first<ProductIdentifierRow>();

    return row ? toProductIdentifier(row) : null;
  }

  async listByCatalogProduct(
    catalogProductId: string,
  ): Promise<ProductIdentifier[]> {
    const result = await this.db
      .prepare(
        `SELECT
           id, catalog_product_id, identifier_type, raw_value,
           normalized_value, created_at, updated_at
         FROM catalog_product_identifiers
         WHERE catalog_product_id = ?
         ORDER BY identifier_type, normalized_value`,
      )
      .bind(catalogProductId)
      .all<ProductIdentifierRow>();

    return result.results.map(toProductIdentifier);
  }
}

import type {
  CatalogProduct,
  CreateCatalogProduct,
} from "../types";

interface CatalogProductRow {
  id: string;
  game_id: string;
  name: string;
  product_type: string;
  release_date: string | null;
  image_url: string | null;
  active: number;
  created_at: string;
  updated_at: string;
}

const toCatalogProduct = (
  row: CatalogProductRow,
): CatalogProduct => ({
  id: row.id,
  gameId: row.game_id,
  name: row.name,
  productType: row.product_type,
  releaseDate: row.release_date,
  imageUrl: row.image_url,
  active: row.active === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class ProductRepository {
  constructor(private readonly db: D1Database) {}

  async create(input: CreateCatalogProduct): Promise<CatalogProduct> {
    const timestamp = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO catalog_products(
           id, game_id, name, product_type, release_date, image_url,
           active, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.gameId,
        input.name,
        input.productType,
        input.releaseDate ?? null,
        input.imageUrl ?? null,
        input.active === false ? 0 : 1,
        timestamp,
        timestamp,
      )
      .run();

    const product = await this.findById(input.id);

    if (!product) {
      throw new Error(`Catalog product unavailable after insert: ${input.id}`);
    }

    return product;
  }

  async findById(id: string): Promise<CatalogProduct | null> {
    const row = await this.db
      .prepare(
        `SELECT
           id, game_id, name, product_type, release_date, image_url,
           active, created_at, updated_at
         FROM catalog_products
         WHERE id = ?`,
      )
      .bind(id)
      .first<CatalogProductRow>();

    return row ? toCatalogProduct(row) : null;
  }

  async listByGame(gameId: string): Promise<CatalogProduct[]> {
    const result = await this.db
      .prepare(
        `SELECT
           id, game_id, name, product_type, release_date, image_url,
           active, created_at, updated_at
         FROM catalog_products
         WHERE game_id = ?
         ORDER BY name`,
      )
      .bind(gameId)
      .all<CatalogProductRow>();

    return result.results.map(toCatalogProduct);
  }
}

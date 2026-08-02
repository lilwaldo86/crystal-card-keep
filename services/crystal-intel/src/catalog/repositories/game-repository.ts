import type { CatalogGame } from "../types";

interface CatalogGameRow {
  id: string;
  slug: string;
  name: string;
  active: number;
  created_at: string;
  updated_at: string;
}

const toCatalogGame = (row: CatalogGameRow): CatalogGame => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  active: row.active === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class GameRepository {
  constructor(private readonly db: D1Database) {}

  async findById(id: string): Promise<CatalogGame | null> {
    const row = await this.db
      .prepare(
        `SELECT id, slug, name, active, created_at, updated_at
         FROM catalog_games
         WHERE id = ?`,
      )
      .bind(id)
      .first<CatalogGameRow>();

    return row ? toCatalogGame(row) : null;
  }

  async listActive(): Promise<CatalogGame[]> {
    const result = await this.db
      .prepare(
        `SELECT id, slug, name, active, created_at, updated_at
         FROM catalog_games
         WHERE active = 1
         ORDER BY name`,
      )
      .all<CatalogGameRow>();

    return result.results.map(toCatalogGame);
  }
}

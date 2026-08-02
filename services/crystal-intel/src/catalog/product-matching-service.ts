import { normalizeProductIdentifier } from "./product-identifiers.ts";
import type { ProductIdentifierLookup } from "./repositories/product-identifier-repository";
import type {
  ProductIdentifierCandidate,
  ProductMatch,
} from "./types";

export class ConflictingProductMatchError extends Error {
  constructor(public readonly catalogProductIds: string[]) {
    super(
      `Identifiers resolve to multiple catalog products: ${catalogProductIds.join(", ")}`,
    );
    this.name = "ConflictingProductMatchError";
  }
}

export class ProductMatchingService {
  constructor(private readonly identifiers: ProductIdentifierLookup) {}

  async findMatch(
    candidates: ProductIdentifierCandidate[],
  ): Promise<ProductMatch | null> {
    const matches = await Promise.all(
      candidates.map(async (candidate) => {
        const normalizedValue = normalizeProductIdentifier(
          candidate.identifierType,
          candidate.value,
        );

        return this.identifiers.findByNormalizedValue(
          candidate.identifierType,
          normalizedValue,
        );
      }),
    );

    const matchedIdentifiers = matches.filter(
      (match) => match !== null,
    );

    if (matchedIdentifiers.length === 0) {
      return null;
    }

    const catalogProductIds = [
      ...new Set(
        matchedIdentifiers.map(
          (identifier) => identifier.catalogProductId,
        ),
      ),
    ];

    if (catalogProductIds.length > 1) {
      throw new ConflictingProductMatchError(catalogProductIds);
    }

    const catalogProductId = catalogProductIds[0];

    if (!catalogProductId) {
      return null;
    }

    return {
      catalogProductId,
      matchedIdentifiers,
    };
  }
}

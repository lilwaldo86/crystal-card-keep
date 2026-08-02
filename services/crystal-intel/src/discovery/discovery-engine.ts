import type {
  ProductIdentifierCandidate,
  ProductMatch,
} from "../catalog/types";
import type { RetailerAdapterRegistry } from "../retailers/adapter-registry";
import { sha256 } from "../retailers/normalization.ts";
import type { RetailerDiscoveryItem } from "../retailers/types";
import type { DiscoveryCandidateStore } from "./repositories/discovery-candidate-repository";
import type { DiscoveryRunStore } from "./repositories/discovery-run-repository";
import type {
  DiscoveryCandidate,
  DiscoveryExecutionResult,
  DiscoveryJob,
  DiscoveryMatchStatus,
} from "./types";

export interface ProductMatcher {
  findMatch(
    candidates: ProductIdentifierCandidate[],
  ): Promise<ProductMatch | null>;
}

export interface DiscoveryIdGenerator {
  next(): string;
}

const defaultIdGenerator: DiscoveryIdGenerator = {
  next: () => crypto.randomUUID(),
};

export class DiscoveryEngine {
  constructor(
    private readonly adapters: RetailerAdapterRegistry,
    private readonly matcher: ProductMatcher,
    private readonly runs: DiscoveryRunStore,
    private readonly candidates: DiscoveryCandidateStore,
    private readonly ids: DiscoveryIdGenerator = defaultIdGenerator,
  ) {}

  async execute(
    job: DiscoveryJob,
  ): Promise<DiscoveryExecutionResult> {
    const startedAt = new Date().toISOString();
    await this.runs.start(job, startedAt);

    try {
      const adapter = this.adapters.get(job.retailerId);
      const discovered = await adapter.discover({
        sourceUrl: job.sourceUrl,
        query: job.query ?? null,
      });
      const candidates: DiscoveryCandidate[] = [];

      for (const item of discovered) {
        candidates.push(
          await this.recordCandidate(job, item),
        );
      }

      const run = await this.runs.complete(
        job.id,
        new Date().toISOString(),
        candidates.length,
      );

      return {
        run,
        candidates,
      };
    } catch (error) {
      await this.runs.fail(
        job.id,
        new Date().toISOString(),
        String(error),
      );
      throw error;
    }
  }

  private async recordCandidate(
    job: DiscoveryJob,
    item: RetailerDiscoveryItem,
  ): Promise<DiscoveryCandidate> {
    let matchStatus: DiscoveryMatchStatus = "UNMATCHED";
    let matchedCatalogProductId: string | null = null;
    let matchError: string | null = null;

    try {
      const match = await this.matcher.findMatch(item.identifiers);

      if (match) {
        matchStatus = "MATCHED";
        matchedCatalogProductId = match.catalogProductId;
      }
    } catch (error) {
      matchStatus = "CONFLICT";
      matchError = String(error).slice(0, 500);
    }

    const sourceFingerprint = await sha256(
      JSON.stringify({
        retailerId: job.retailerId,
        externalId: item.externalId,
        canonicalUrl: item.canonicalUrl,
        title: item.title,
        priceCents: item.priceCents,
        currency: item.currency,
        availability: item.availability,
        identifiers: item.identifiers,
      }),
    );

    return this.candidates.record({
      id: this.ids.next(),
      discoveryRunId: job.id,
      retailerId: job.retailerId,
      externalId: item.externalId,
      canonicalUrl: item.canonicalUrl,
      title: item.title,
      priceCents: item.priceCents,
      currency: item.currency,
      availability: item.availability,
      sourceFingerprint,
      matchStatus,
      matchedCatalogProductId,
      matchError,
    });
  }
}

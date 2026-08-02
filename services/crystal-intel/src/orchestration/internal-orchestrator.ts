import type {
  ListingObservation,
  RecordListingObservation,
  RetailerListing,
  UpsertRetailerListing,
} from "../catalog/types";
import type { AlertEvaluator } from "../alerts/alert-engine";
import type {
  DiscoveryCandidate,
  DiscoveryExecutionResult,
  DiscoveryJob,
} from "../discovery/types";
import type {
  AuditEventStore,
} from "./repositories/audit-event-repository";
import type {
  OrchestrationJobStore,
} from "./repositories/orchestration-job-repository";

export interface DiscoveryExecutor {
  execute(job: DiscoveryJob): Promise<DiscoveryExecutionResult>;
}

export interface ApprovedCandidateReader {
  listApproved(limit?: number): Promise<DiscoveryCandidate[]>;
}

export interface RetailerListingWriter {
  findByRetailerExternalId(
    retailer: string,
    externalId: string,
  ): Promise<RetailerListing | null>;
  upsert(input: UpsertRetailerListing): Promise<RetailerListing>;
}

export interface ListingObservationWriter {
  latestForListing(
    listingId: string,
  ): Promise<ListingObservation | null>;
  record(
    input: RecordListingObservation,
  ): Promise<{
    observation: ListingObservation;
    created: boolean;
  }>;
}

export interface OrchestrationIdGenerator {
  next(): string;
}

const defaultIdGenerator: OrchestrationIdGenerator = {
  next: () => crypto.randomUUID(),
};

const noOpAlertEvaluator: AlertEvaluator = {
  evaluate: async () => [],
};

export class InternalOrchestrator {
  constructor(
    private readonly discovery: DiscoveryExecutor,
    private readonly candidates: ApprovedCandidateReader,
    private readonly listings: RetailerListingWriter,
    private readonly observations: ListingObservationWriter,
    private readonly jobs: OrchestrationJobStore,
    private readonly audits: AuditEventStore,
    private readonly ids: OrchestrationIdGenerator = defaultIdGenerator,
    private readonly alerts: AlertEvaluator = noOpAlertEvaluator,
  ) {}

  async runDiscovery(job: DiscoveryJob): Promise<boolean> {
    const orchestrationId = `discovery-run:${job.id}`;
    const startedAt = new Date().toISOString();
    const claimed = await this.jobs.claim(
      orchestrationId,
      "DISCOVERY_RUN",
      job.id,
      startedAt,
    );

    if (!claimed) {
      return false;
    }

    await this.audit(
      "DISCOVERY_RUN_STARTED",
      "discovery_run",
      job.id,
      {
        retailerId: job.retailerId,
        sourceUrl: job.sourceUrl,
      },
    );

    try {
      const result = await this.discovery.execute(job);
      const completedAt = new Date().toISOString();
      await this.jobs.succeed(orchestrationId, completedAt);
      await this.audit(
        "DISCOVERY_RUN_SUCCEEDED",
        "discovery_run",
        job.id,
        {
          candidatesFound: result.candidates.length,
        },
      );
      return true;
    } catch (error) {
      const completedAt = new Date().toISOString();
      await this.jobs.fail(
        orchestrationId,
        completedAt,
        String(error),
      );
      await this.audit(
        "DISCOVERY_RUN_FAILED",
        "discovery_run",
        job.id,
        {
          error: String(error).slice(0, 500),
        },
      );
      throw error;
    }
  }

  async processApprovedCandidates(limit = 100): Promise<number> {
    const candidates = await this.candidates.listApproved(limit);
    let processed = 0;

    for (const candidate of candidates) {
      if (await this.processCandidate(candidate)) {
        processed += 1;
      }
    }

    return processed;
  }

  private async processCandidate(
    candidate: DiscoveryCandidate,
  ): Promise<boolean> {
    const orchestrationId = `process-candidate:${candidate.id}`;
    const startedAt = new Date().toISOString();
    const claimed = await this.jobs.claim(
      orchestrationId,
      "PROCESS_CANDIDATE",
      candidate.id,
      startedAt,
    );

    if (!claimed) {
      return false;
    }

    if (!candidate.matchedCatalogProductId) {
      const reason =
        "Approved candidate requires a catalog identity link before processing.";
      await this.jobs.block(orchestrationId, new Date().toISOString(), reason);
      await this.audit(
        "DISCOVERY_CANDIDATE_BLOCKED",
        "discovery_candidate",
        candidate.id,
        {
          reason,
          matchStatus: candidate.matchStatus,
        },
      );
      return false;
    }

    try {
      const existingListing =
        await this.listings.findByRetailerExternalId(
          candidate.retailerId,
          candidate.externalId,
        );

      if (
        existingListing &&
        existingListing.catalogProductId !==
          candidate.matchedCatalogProductId
      ) {
        const reason =
          `Retailer listing is already linked to catalog product ${existingListing.catalogProductId}.`;
        await this.jobs.block(
          orchestrationId,
          new Date().toISOString(),
          reason,
        );
        await this.audit(
          "DISCOVERY_CANDIDATE_LINK_CONFLICT",
          "discovery_candidate",
          candidate.id,
          {
            existingCatalogProductId:
              existingListing.catalogProductId,
            requestedCatalogProductId:
              candidate.matchedCatalogProductId,
            listingId: existingListing.id,
          },
        );
        return false;
      }

      const listing = await this.listings.upsert({
        id: `listing:${candidate.retailerId}:${candidate.externalId}`,
        catalogProductId: candidate.matchedCatalogProductId,
        retailer: candidate.retailerId,
        externalId: candidate.externalId,
        canonicalUrl: candidate.canonicalUrl,
        currency: candidate.currency,
        active: true,
      });
      const previousObservation =
        await this.observations.latestForListing(listing.id);
      const observationResult = await this.observations.record({
        id: `observation:discovery:${candidate.id}`,
        listingId: listing.id,
        idempotencyKey: `discovery-candidate:${candidate.id}`,
        observedAt: candidate.createdAt,
        availability: candidate.availability,
        priceCents: candidate.priceCents,
        currency: candidate.currency,
        stockQuantity: null,
        sourceFingerprint: candidate.sourceFingerprint,
      });
      const alerts = await this.alerts.evaluate({
        listing,
        observation: observationResult.observation,
        previousObservation,
        isNewListing: existingListing === null,
      });
      await this.jobs.succeed(
        orchestrationId,
        new Date().toISOString(),
      );
      await this.audit(
        "DISCOVERY_CANDIDATE_PROCESSED",
        "discovery_candidate",
        candidate.id,
        {
          catalogProductId: candidate.matchedCatalogProductId,
          listingId: listing.id,
          observationId: observationResult.observation.id,
          observationCreated: observationResult.created,
          alertsGenerated: alerts.map((alert) => alert.alertType),
        },
      );
      return true;
    } catch (error) {
      await this.jobs.fail(
        orchestrationId,
        new Date().toISOString(),
        String(error),
      );
      await this.audit(
        "DISCOVERY_CANDIDATE_FAILED",
        "discovery_candidate",
        candidate.id,
        {
          error: String(error).slice(0, 500),
        },
      );
      return false;
    }
  }

  private async audit(
    eventType: string,
    entityType: string,
    entityId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.audits.record({
      id: this.ids.next(),
      eventType,
      entityType,
      entityId,
      payload,
      createdAt: new Date().toISOString(),
    });
  }
}

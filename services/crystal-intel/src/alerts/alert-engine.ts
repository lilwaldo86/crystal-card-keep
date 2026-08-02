import type { ListingAvailability } from "../catalog/types";
import type { IntelligenceAlertStore } from "./repositories/alert-repository";
import type {
  AlertEvaluationContext,
  AlertSeverity,
  AlertType,
  IntelligenceAlert,
} from "./types";

interface AlertDefinition {
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  payload: Record<string, unknown>;
}

const availableStates = new Set<ListingAvailability>([
  "IN_STOCK",
  "LIMITED_STOCK",
  "PREORDER",
]);

export interface AlertEvaluator {
  evaluate(
    context: AlertEvaluationContext,
  ): Promise<IntelligenceAlert[]>;
}

export class AlertEngine implements AlertEvaluator {
  constructor(private readonly alerts: IntelligenceAlertStore) {}

  async evaluate(
    context: AlertEvaluationContext,
  ): Promise<IntelligenceAlert[]> {
    const definitions = this.detect(context);
    const createdAt = new Date().toISOString();

    return Promise.all(
      definitions.map((definition) => {
        const idempotencyKey =
          `${definition.alertType}:${context.observation.id}`;

        return this.alerts.record({
          id: `alert:${idempotencyKey}`,
          idempotencyKey,
          alertType: definition.alertType,
          severity: definition.severity,
          listingId: context.listing.id,
          listingObservationId: context.observation.id,
          previousObservationId:
            context.previousObservation?.id ?? null,
          message: definition.message,
          payload: definition.payload,
          createdAt,
        });
      }),
    );
  }

  private detect(
    context: AlertEvaluationContext,
  ): AlertDefinition[] {
    const definitions: AlertDefinition[] = [];
    const { listing, observation, previousObservation } = context;

    if (context.isNewListing) {
      definitions.push({
        alertType: "NEW_LISTING",
        severity: "INFO",
        message:
          `New ${listing.retailer} listing discovered: ${listing.externalId}`,
        payload: {
          retailer: listing.retailer,
          externalId: listing.externalId,
          canonicalUrl: listing.canonicalUrl,
          availability: observation.availability,
          priceCents: observation.priceCents,
          currency: observation.currency,
        },
      });
    }

    if (
      previousObservation &&
      !availableStates.has(previousObservation.availability) &&
      availableStates.has(observation.availability)
    ) {
      definitions.push({
        alertType: "RESTOCK",
        severity: "HIGH",
        message:
          `${listing.retailer} listing ${listing.externalId} became available.`,
        payload: {
          previousAvailability: previousObservation.availability,
          availability: observation.availability,
          priceCents: observation.priceCents,
          currency: observation.currency,
          canonicalUrl: listing.canonicalUrl,
        },
      });
    }

    if (
      previousObservation?.priceCents !== null &&
      previousObservation?.priceCents !== undefined &&
      observation.priceCents !== null
    ) {
      if (observation.priceCents < previousObservation.priceCents) {
        definitions.push(
          this.priceDefinition(
            "PRICE_DECREASE",
            listing.retailer,
            listing.externalId,
            listing.canonicalUrl,
            previousObservation.priceCents,
            observation.priceCents,
            observation.currency,
          ),
        );
      } else if (
        observation.priceCents > previousObservation.priceCents
      ) {
        definitions.push(
          this.priceDefinition(
            "PRICE_INCREASE",
            listing.retailer,
            listing.externalId,
            listing.canonicalUrl,
            previousObservation.priceCents,
            observation.priceCents,
            observation.currency,
          ),
        );
      }
    }

    return definitions;
  }

  private priceDefinition(
    alertType: "PRICE_DECREASE" | "PRICE_INCREASE",
    retailer: string,
    externalId: string,
    canonicalUrl: string,
    previousPriceCents: number,
    priceCents: number,
    currency: string,
  ): AlertDefinition {
    return {
      alertType,
      severity: alertType === "PRICE_DECREASE" ? "HIGH" : "INFO",
      message:
        `${retailer} listing ${externalId} price changed from ` +
        `${previousPriceCents} to ${priceCents} ${currency} cents.`,
      payload: {
        previousPriceCents,
        priceCents,
        currency,
        canonicalUrl,
      },
    };
  }
}

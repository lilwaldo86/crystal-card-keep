import type {
  ListingObservation,
  RetailerListing,
} from "../catalog/types";

export type AlertType =
  | "NEW_LISTING"
  | "RESTOCK"
  | "PRICE_DECREASE"
  | "PRICE_INCREASE";

export type AlertSeverity = "INFO" | "HIGH";
export type NotificationChannel = "INTERNAL";
export type NotificationStatus = "PENDING" | "DELIVERED" | "FAILED";

export interface IntelligenceAlert {
  id: string;
  idempotencyKey: string;
  alertType: AlertType;
  severity: AlertSeverity;
  listingId: string;
  listingObservationId: string;
  previousObservationId: string | null;
  message: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationEvent {
  id: string;
  alertId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  payload: Record<string, unknown>;
  createdAt: string;
  deliveredAt: string | null;
  errorMessage: string | null;
}

export interface RecordIntelligenceAlert {
  id: string;
  idempotencyKey: string;
  alertType: AlertType;
  severity: AlertSeverity;
  listingId: string;
  listingObservationId: string;
  previousObservationId: string | null;
  message: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AlertEvaluationContext {
  listing: RetailerListing;
  observation: ListingObservation;
  previousObservation: ListingObservation | null;
  isNewListing: boolean;
}

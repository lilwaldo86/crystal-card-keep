import type { RetailerAvailability } from "../retailers/types";

export type DiscoveryJobKind = "URL_SCAN";
export type DiscoveryRunStatus = "RUNNING" | "SUCCEEDED" | "FAILED";
export type DiscoveryMatchStatus =
  | "MATCHED"
  | "UNMATCHED"
  | "CONFLICT";
export type DiscoveryReviewStatus =
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED";

export interface DiscoveryJob {
  id: string;
  retailerId: string;
  kind: DiscoveryJobKind;
  sourceUrl: string;
  query?: string | null;
}

export interface DiscoveryRun {
  id: string;
  retailerId: string;
  jobKind: DiscoveryJobKind;
  sourceUrl: string;
  query: string | null;
  status: DiscoveryRunStatus;
  startedAt: string;
  completedAt: string | null;
  candidatesFound: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveryCandidate {
  id: string;
  discoveryRunId: string;
  retailerId: string;
  externalId: string;
  canonicalUrl: string;
  title: string | null;
  priceCents: number | null;
  currency: string;
  availability: RetailerAvailability;
  sourceFingerprint: string | null;
  matchStatus: DiscoveryMatchStatus;
  matchedCatalogProductId: string | null;
  matchError: string | null;
  reviewStatus: DiscoveryReviewStatus;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecordDiscoveryCandidate {
  id: string;
  discoveryRunId: string;
  retailerId: string;
  externalId: string;
  canonicalUrl: string;
  title: string | null;
  priceCents: number | null;
  currency: string;
  availability: RetailerAvailability;
  sourceFingerprint: string | null;
  matchStatus: DiscoveryMatchStatus;
  matchedCatalogProductId: string | null;
  matchError: string | null;
}

export interface ReviewDiscoveryCandidate {
  candidateId: string;
  decision: "APPROVED" | "REJECTED";
  reviewedAt: string;
  notes?: string | null;
}

export interface DiscoveryExecutionResult {
  run: DiscoveryRun;
  candidates: DiscoveryCandidate[];
}

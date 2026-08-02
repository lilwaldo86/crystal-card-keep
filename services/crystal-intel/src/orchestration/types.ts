export type OrchestrationJobType =
  | "DISCOVERY_RUN"
  | "PROCESS_CANDIDATE";

export type OrchestrationJobStatus =
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "BLOCKED";

export interface OrchestrationJob {
  id: string;
  jobType: OrchestrationJobType;
  entityId: string;
  status: OrchestrationJobStatus;
  attemptCount: number;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface RecordAuditEvent {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

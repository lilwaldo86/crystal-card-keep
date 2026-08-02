import type {
  OrchestrationJob,
  OrchestrationJobStatus,
  OrchestrationJobType,
} from "../types";

interface OrchestrationJobRow {
  id: string;
  job_type: OrchestrationJobType;
  entity_id: string;
  status: OrchestrationJobStatus;
  attempt_count: number;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

const toOrchestrationJob = (
  row: OrchestrationJobRow,
): OrchestrationJob => ({
  id: row.id,
  jobType: row.job_type,
  entityId: row.entity_id,
  status: row.status,
  attemptCount: row.attempt_count,
  startedAt: row.started_at,
  completedAt: row.completed_at,
  errorMessage: row.error_message,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export interface OrchestrationJobStore {
  claim(
    id: string,
    jobType: OrchestrationJobType,
    entityId: string,
    startedAt: string,
  ): Promise<boolean>;
  succeed(id: string, completedAt: string): Promise<void>;
  fail(
    id: string,
    completedAt: string,
    errorMessage: string,
  ): Promise<void>;
  block(
    id: string,
    completedAt: string,
    reason: string,
  ): Promise<void>;
}

export class OrchestrationJobRepository
  implements OrchestrationJobStore
{
  constructor(private readonly db: D1Database) {}

  async claim(
    id: string,
    jobType: OrchestrationJobType,
    entityId: string,
    startedAt: string,
  ): Promise<boolean> {
    const inserted = await this.db
      .prepare(
        `INSERT OR IGNORE INTO orchestration_jobs(
           id, job_type, entity_id, status, attempt_count,
           started_at, created_at, updated_at
         ) VALUES (?, ?, ?, 'RUNNING', 1, ?, ?, ?)`,
      )
      .bind(id, jobType, entityId, startedAt, startedAt, startedAt)
      .run();

    if ((inserted.meta.changes ?? 0) === 1) {
      return true;
    }

    const retried = await this.db
      .prepare(
        `UPDATE orchestration_jobs
         SET status = 'RUNNING',
             attempt_count = attempt_count + 1,
             started_at = ?,
             completed_at = NULL,
             error_message = NULL,
             updated_at = ?
         WHERE id = ?
           AND status = 'FAILED'
           AND attempt_count < 3`,
      )
      .bind(startedAt, startedAt, id)
      .run();

    return (retried.meta.changes ?? 0) === 1;
  }

  async succeed(id: string, completedAt: string): Promise<void> {
    await this.finish(id, "SUCCEEDED", completedAt, null);
  }

  async fail(
    id: string,
    completedAt: string,
    errorMessage: string,
  ): Promise<void> {
    await this.finish(
      id,
      "FAILED",
      completedAt,
      errorMessage.slice(0, 500),
    );
  }

  async block(
    id: string,
    completedAt: string,
    reason: string,
  ): Promise<void> {
    await this.finish(
      id,
      "BLOCKED",
      completedAt,
      reason.slice(0, 500),
    );
  }

  async findById(id: string): Promise<OrchestrationJob | null> {
    const row = await this.db
      .prepare(
        `SELECT
           id, job_type, entity_id, status, attempt_count,
           started_at, completed_at, error_message, created_at, updated_at
         FROM orchestration_jobs
         WHERE id = ?`,
      )
      .bind(id)
      .first<OrchestrationJobRow>();

    return row ? toOrchestrationJob(row) : null;
  }

  private async finish(
    id: string,
    status: OrchestrationJobStatus,
    completedAt: string,
    errorMessage: string | null,
  ): Promise<void> {
    await this.db
      .prepare(
        `UPDATE orchestration_jobs
         SET status = ?,
             completed_at = ?,
             error_message = ?,
             updated_at = ?
         WHERE id = ? AND status = 'RUNNING'`,
      )
      .bind(status, completedAt, errorMessage, completedAt, id)
      .run();
  }
}

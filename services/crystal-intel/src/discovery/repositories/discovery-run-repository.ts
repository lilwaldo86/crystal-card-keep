import type {
  DiscoveryJob,
  DiscoveryRun,
  DiscoveryRunStatus,
} from "../types";

interface DiscoveryRunRow {
  id: string;
  retailer: string;
  job_kind: DiscoveryJob["kind"];
  source_url: string;
  query: string | null;
  status: DiscoveryRunStatus;
  started_at: string;
  completed_at: string | null;
  candidates_found: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

const toDiscoveryRun = (row: DiscoveryRunRow): DiscoveryRun => ({
  id: row.id,
  retailerId: row.retailer,
  jobKind: row.job_kind,
  sourceUrl: row.source_url,
  query: row.query,
  status: row.status,
  startedAt: row.started_at,
  completedAt: row.completed_at,
  candidatesFound: row.candidates_found,
  errorMessage: row.error_message,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export interface DiscoveryRunStore {
  start(job: DiscoveryJob, startedAt: string): Promise<DiscoveryRun>;
  complete(
    runId: string,
    completedAt: string,
    candidatesFound: number,
  ): Promise<DiscoveryRun>;
  fail(
    runId: string,
    completedAt: string,
    errorMessage: string,
  ): Promise<DiscoveryRun>;
}

export class DiscoveryRunRepository implements DiscoveryRunStore {
  constructor(private readonly db: D1Database) {}

  async start(
    job: DiscoveryJob,
    startedAt: string,
  ): Promise<DiscoveryRun> {
    await this.db
      .prepare(
        `INSERT INTO discovery_runs(
           id, retailer, job_kind, source_url, query, status,
           started_at, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, 'RUNNING', ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           status = 'RUNNING',
           completed_at = NULL,
           candidates_found = 0,
           error_message = NULL,
           updated_at = excluded.updated_at`,
      )
      .bind(
        job.id,
        job.retailerId,
        job.kind,
        job.sourceUrl,
        job.query ?? null,
        startedAt,
        startedAt,
        startedAt,
      )
      .run();

    return this.requireById(job.id);
  }

  async complete(
    runId: string,
    completedAt: string,
    candidatesFound: number,
  ): Promise<DiscoveryRun> {
    await this.db
      .prepare(
        `UPDATE discovery_runs
         SET status = 'SUCCEEDED',
             completed_at = ?,
             candidates_found = ?,
             error_message = NULL,
             updated_at = ?
         WHERE id = ?`,
      )
      .bind(completedAt, candidatesFound, completedAt, runId)
      .run();

    return this.requireById(runId);
  }

  async fail(
    runId: string,
    completedAt: string,
    errorMessage: string,
  ): Promise<DiscoveryRun> {
    await this.db
      .prepare(
        `UPDATE discovery_runs
         SET status = 'FAILED',
             completed_at = ?,
             error_message = ?,
             updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        completedAt,
        errorMessage.slice(0, 500),
        completedAt,
        runId,
      )
      .run();

    return this.requireById(runId);
  }

  async findById(id: string): Promise<DiscoveryRun | null> {
    const row = await this.db
      .prepare(
        `SELECT
           id, retailer, job_kind, source_url, query, status,
           started_at, completed_at, candidates_found, error_message,
           created_at, updated_at
         FROM discovery_runs
         WHERE id = ?`,
      )
      .bind(id)
      .first<DiscoveryRunRow>();

    return row ? toDiscoveryRun(row) : null;
  }

  private async requireById(id: string): Promise<DiscoveryRun> {
    const run = await this.findById(id);

    if (!run) {
      throw new Error(`Discovery run unavailable: ${id}`);
    }

    return run;
  }
}

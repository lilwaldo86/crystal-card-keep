import type {
  ArchiveDataSource,
  ArchiveObjectRecord,
  ArchiveRow,
  ArchiveRunStore,
  ArchiveWindow,
} from "./types.ts";

interface DatasetDefinition {
  from: string;
  id: string;
  timestamp: string;
  retailer: string;
}

const definitions: Record<string, DatasetDefinition> = {
  observations: {
    from: "observations source",
    id: "source.id",
    timestamp: "source.observed_at",
    retailer: "source.retailer",
  },
  discovery_runs: {
    from: "discovery_runs source",
    id: "source.id",
    timestamp: "source.started_at",
    retailer: "source.retailer",
  },
  discovery_candidates: {
    from: "discovery_candidates source",
    id: "source.id",
    timestamp: "source.created_at",
    retailer: "source.retailer",
  },
  listing_observations: {
    from: "listing_observations source JOIN catalog_retailer_listings listing ON listing.id = source.listing_id",
    id: "source.id",
    timestamp: "source.observed_at",
    retailer: "listing.retailer",
  },
  orchestration_jobs: {
    from: "orchestration_jobs source",
    id: "source.id",
    timestamp: "source.started_at",
    retailer: "NULL",
  },
  audit_events: {
    from: "audit_events source",
    id: "source.id",
    timestamp: "source.created_at",
    retailer: "NULL",
  },
  intelligence_alerts: {
    from: "intelligence_alerts source JOIN catalog_retailer_listings listing ON listing.id = source.listing_id",
    id: "source.id",
    timestamp: "source.created_at",
    retailer: "listing.retailer",
  },
  notification_events: {
    from: "notification_events source JOIN intelligence_alerts alert ON alert.id = source.alert_id JOIN catalog_retailer_listings listing ON listing.id = alert.listing_id",
    id: "source.id",
    timestamp: "source.created_at",
    retailer: "listing.retailer",
  },
};

interface ArchiveQueryRow extends Record<string, unknown> {
  archive_id: string;
  archive_timestamp: string;
  archive_retailer: string | null;
}

interface ArchiveObjectRow {
  object_key: string;
  dataset: string;
  retailer: string | null;
  record_count: number;
  compressed_bytes: number;
  sha256: string;
  window_start: string;
  window_end: string;
}

export class D1ArchiveRepository implements ArchiveDataSource, ArchiveRunStore {
  constructor(private readonly db: D1Database) {}

  async earliestSourceTimestamp(): Promise<string | null> {
    const row = await this.db.prepare(
      `SELECT MIN(value) AS earliest FROM (
         SELECT MIN(observed_at) AS value FROM observations
         UNION ALL SELECT MIN(started_at) FROM discovery_runs
         UNION ALL SELECT MIN(created_at) FROM discovery_candidates
         UNION ALL SELECT MIN(observed_at) FROM listing_observations
         UNION ALL SELECT MIN(started_at) FROM orchestration_jobs
         UNION ALL SELECT MIN(created_at) FROM audit_events
         UNION ALL SELECT MIN(created_at) FROM intelligence_alerts
         UNION ALL SELECT MIN(created_at) FROM notification_events
       ) WHERE value IS NOT NULL`,
    ).first<{ earliest: string | null }>();
    return row?.earliest ?? null;
  }

  async earliestArchivedStart(): Promise<string | null> {
    const row = await this.db.prepare(
      "SELECT MIN(window_start) AS earliest FROM archive_runs WHERE status='SUCCEEDED'",
    ).first<{ earliest: string | null }>();
    return row?.earliest ?? null;
  }

  async readPage(
    dataset: string,
    window: ArchiveWindow,
    afterTimestamp: string | null,
    afterId: string | null,
    limit: number,
  ): Promise<ArchiveRow[]> {
    const definition = definitions[dataset];
    if (!definition) throw new Error(`Unsupported archive dataset: ${dataset}`);

    const cursor = afterTimestamp !== null && afterId !== null;
    const result = await this.db.prepare(
      `SELECT source.*, ${definition.retailer} AS archive_retailer,
              ${definition.id} AS archive_id,
              ${definition.timestamp} AS archive_timestamp
       FROM ${definition.from}
       WHERE ${definition.timestamp} >= ? AND ${definition.timestamp} < ?
         ${cursor ? `AND (${definition.timestamp} > ? OR (${definition.timestamp} = ? AND ${definition.id} > ?))` : ""}
       ORDER BY ${definition.timestamp}, ${definition.id}
       LIMIT ?`,
    ).bind(
      window.start,
      window.end,
      ...(cursor ? [afterTimestamp, afterTimestamp, afterId] : []),
      limit,
    ).all<ArchiveQueryRow>();

    return result.results.map((row) => {
      const {
        archive_id: id,
        archive_timestamp: timestamp,
        archive_retailer: retailer,
        ...payload
      } = row;
      return {
        id,
        timestamp,
        retailer,
        payload,
      };
    });
  }

  async claim(runId: string, window: ArchiveWindow, startedAt: string): Promise<boolean> {
    const inserted = await this.db.prepare(
      `INSERT OR IGNORE INTO archive_runs(
         id, window_start, window_end, status, started_at, updated_at
       ) VALUES (?, ?, ?, 'RUNNING', ?, ?)`,
    ).bind(runId, window.start, window.end, startedAt, startedAt).run();
    if ((inserted.meta.changes ?? 0) === 1) return true;

    const staleBefore = new Date(new Date(startedAt).getTime() - 7_200_000).toISOString();
    const retried = await this.db.prepare(
      `UPDATE archive_runs
       SET status='RUNNING', attempt_count=attempt_count+1, started_at=?,
           completed_at=NULL, error_message=NULL, updated_at=?
       WHERE id=? AND (status='FAILED' OR (status='RUNNING' AND updated_at < ?))`,
    ).bind(startedAt, startedAt, runId, staleBefore).run();
    return (retried.meta.changes ?? 0) === 1;
  }

  async recordObject(runId: string, object: ArchiveObjectRecord): Promise<void> {
    await this.db.prepare(
      `INSERT INTO archive_objects(
         object_key, archive_run_id, dataset, retailer, record_count,
         compressed_bytes, sha256, window_start, window_end, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(object_key) DO UPDATE SET
         archive_run_id=excluded.archive_run_id,
         record_count=excluded.record_count,
         compressed_bytes=excluded.compressed_bytes,
         sha256=excluded.sha256`,
    ).bind(
      object.key, runId, object.dataset, object.retailer, object.recordCount,
      object.compressedBytes, object.sha256, object.window.start, object.window.end,
      new Date().toISOString(),
    ).run();
  }

  async complete(
    runId: string,
    completedAt: string,
    objectCount: number,
    recordCount: number,
  ): Promise<void> {
    await this.db.prepare(
      `UPDATE archive_runs SET status='SUCCEEDED', object_count=?, record_count=?,
       completed_at=?, updated_at=? WHERE id=?`,
    ).bind(objectCount, recordCount, completedAt, completedAt, runId).run();
  }

  async fail(runId: string, completedAt: string, error: string): Promise<void> {
    await this.db.prepare(
      `UPDATE archive_runs SET status='FAILED', completed_at=?, error_message=?,
       updated_at=? WHERE id=?`,
    ).bind(completedAt, error, completedAt, runId).run();
  }

  async listDayObjects(dayStart: string, dayEnd: string): Promise<ArchiveObjectRecord[]> {
    const result = await this.db.prepare(
      `SELECT object_key, dataset, retailer, record_count, compressed_bytes,
              sha256, window_start, window_end
       FROM archive_objects
       WHERE window_start >= ? AND window_start < ?
       ORDER BY window_start, dataset, retailer, object_key`,
    ).bind(dayStart, dayEnd).all<ArchiveObjectRow>();
    return result.results.map((row) => ({
      key: row.object_key,
      dataset: row.dataset,
      retailer: row.retailer,
      recordCount: row.record_count,
      compressedBytes: row.compressed_bytes,
      sha256: row.sha256,
      window: { start: row.window_start, end: row.window_end },
    }));
  }
}

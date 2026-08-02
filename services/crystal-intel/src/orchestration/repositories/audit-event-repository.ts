import type {
  AuditEvent,
  RecordAuditEvent,
} from "../types";

interface AuditEventRow {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  payload_json: string;
  created_at: string;
}

const toAuditEvent = (row: AuditEventRow): AuditEvent => ({
  id: row.id,
  eventType: row.event_type,
  entityType: row.entity_type,
  entityId: row.entity_id,
  payload: JSON.parse(row.payload_json) as Record<string, unknown>,
  createdAt: row.created_at,
});

export interface AuditEventStore {
  record(input: RecordAuditEvent): Promise<void>;
}

export class AuditEventRepository implements AuditEventStore {
  constructor(private readonly db: D1Database) {}

  async record(input: RecordAuditEvent): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO audit_events(
           id, event_type, entity_type, entity_id, payload_json, created_at
         ) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.eventType,
        input.entityType,
        input.entityId,
        JSON.stringify(input.payload),
        input.createdAt,
      )
      .run();
  }

  async listForEntity(
    entityType: string,
    entityId: string,
    limit = 100,
  ): Promise<AuditEvent[]> {
    const boundedLimit = Math.max(1, Math.min(500, limit));
    const result = await this.db
      .prepare(
        `SELECT
           id, event_type, entity_type, entity_id, payload_json, created_at
         FROM audit_events
         WHERE entity_type = ? AND entity_id = ?
         ORDER BY created_at DESC, id DESC
         LIMIT ?`,
      )
      .bind(entityType, entityId, boundedLimit)
      .all<AuditEventRow>();

    return result.results.map(toAuditEvent);
  }
}

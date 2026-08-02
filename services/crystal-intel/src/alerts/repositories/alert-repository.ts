import type {
  AlertSeverity,
  AlertType,
  IntelligenceAlert,
  RecordIntelligenceAlert,
} from "../types";

interface IntelligenceAlertRow {
  id: string;
  idempotency_key: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  listing_id: string;
  listing_observation_id: string;
  previous_observation_id: string | null;
  message: string;
  payload_json: string;
  created_at: string;
}

const toIntelligenceAlert = (
  row: IntelligenceAlertRow,
): IntelligenceAlert => ({
  id: row.id,
  idempotencyKey: row.idempotency_key,
  alertType: row.alert_type,
  severity: row.severity,
  listingId: row.listing_id,
  listingObservationId: row.listing_observation_id,
  previousObservationId: row.previous_observation_id,
  message: row.message,
  payload: JSON.parse(row.payload_json) as Record<string, unknown>,
  createdAt: row.created_at,
});

export interface IntelligenceAlertStore {
  record(input: RecordIntelligenceAlert): Promise<IntelligenceAlert>;
}

export class AlertRepository implements IntelligenceAlertStore {
  constructor(private readonly db: D1Database) {}

  async record(
    input: RecordIntelligenceAlert,
  ): Promise<IntelligenceAlert> {
    const payloadJson = JSON.stringify(input.payload);

    await this.db.batch([
      this.db
        .prepare(
          `INSERT OR IGNORE INTO intelligence_alerts(
             id, idempotency_key, alert_type, severity, listing_id,
             listing_observation_id, previous_observation_id, message,
             payload_json, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          input.id,
          input.idempotencyKey,
          input.alertType,
          input.severity,
          input.listingId,
          input.listingObservationId,
          input.previousObservationId,
          input.message,
          payloadJson,
          input.createdAt,
        ),
      this.db
        .prepare(
          `INSERT OR IGNORE INTO notification_events(
             id, alert_id, channel, status, payload_json, created_at
           ) VALUES (?, ?, 'INTERNAL', 'PENDING', ?, ?)`,
        )
        .bind(
          `notification:${input.id}`,
          input.id,
          payloadJson,
          input.createdAt,
        ),
    ]);

    const alert = await this.findByIdempotencyKey(
      input.idempotencyKey,
    );

    if (!alert) {
      throw new Error(
        `Intelligence alert unavailable after record: ${input.idempotencyKey}`,
      );
    }

    return alert;
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<IntelligenceAlert | null> {
    const row = await this.db
      .prepare(
        `SELECT
           id, idempotency_key, alert_type, severity, listing_id,
           listing_observation_id, previous_observation_id, message,
           payload_json, created_at
         FROM intelligence_alerts
         WHERE idempotency_key = ?`,
      )
      .bind(idempotencyKey)
      .first<IntelligenceAlertRow>();

    return row ? toIntelligenceAlert(row) : null;
  }
}

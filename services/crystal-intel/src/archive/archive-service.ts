import { gzipText, sha256Hex } from "./compression.ts";
import type {
  ArchiveBucket,
  ArchiveDataSource,
  ArchiveManifest,
  ArchiveObjectRecord,
  ArchiveRow,
  ArchiveRunStore,
  ArchiveWindow,
} from "./types.ts";

const PAGE_SIZE = 1000;
const datasets = [
  "observations",
  "discovery_runs",
  "discovery_candidates",
  "listing_observations",
  "orchestration_jobs",
  "audit_events",
  "intelligence_alerts",
  "notification_events",
] as const;

const safeSegment = (value: string | null): string =>
  (value ?? "global").toLowerCase().replace(/[^a-z0-9._-]+/g, "-");

const dateParts = (timestamp: string) => {
  const date = new Date(timestamp);
  return {
    year: String(date.getUTCFullYear()).padStart(4, "0"),
    month: String(date.getUTCMonth() + 1).padStart(2, "0"),
    day: String(date.getUTCDate()).padStart(2, "0"),
    hour: String(date.getUTCHours()).padStart(2, "0"),
  };
};

export function closedHourWindow(scheduledTime: number): ArchiveWindow {
  const end = new Date(Math.floor(scheduledTime / 3_600_000) * 3_600_000);
  const start = new Date(end.getTime() - 3_600_000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function archiveObjectKey(
  dataset: string,
  retailer: string | null,
  window: ArchiveWindow,
  part: number,
): string {
  const { year, month, day, hour } = dateParts(window.start);
  return [
    "v1",
    safeSegment(dataset),
    `retailer=${safeSegment(retailer)}`,
    `year=${year}`,
    `month=${month}`,
    `day=${day}`,
    `hour=${hour}`,
    `part-${String(part).padStart(5, "0")}.ndjson.gz`,
  ].join("/");
}

const manifestKey = (day: string): string => {
  const { year, month, day: dayOfMonth } = dateParts(day);
  return `manifests/year=${year}/month=${month}/day=${dayOfMonth}/manifest.json`;
};

const serializeRows = (dataset: string, rows: ArchiveRow[]): string =>
  rows.map((row) => JSON.stringify({
    schemaVersion: 1,
    dataset,
    archivedTimestamp: row.timestamp,
    ...row.payload,
  })).join("\n") + "\n";

export class HistoricalArchiveService {
  constructor(
    private readonly source: ArchiveDataSource,
    private readonly runs: ArchiveRunStore,
    private readonly bucket: ArchiveBucket,
    private readonly clock: () => string = () => new Date().toISOString(),
  ) {}

  async archive(window: ArchiveWindow): Promise<boolean> {
    const runId = `hourly:${window.start}`;
    if (!(await this.runs.claim(runId, window, this.clock()))) {
      return false;
    }

    let objectCount = 0;
    let recordCount = 0;

    try {
      for (const dataset of datasets) {
        const parts = new Map<string, number>();
        let afterTimestamp: string | null = null;
        let afterId: string | null = null;

        while (true) {
          const rows = await this.source.readPage(
            dataset,
            window,
            afterTimestamp,
            afterId,
            PAGE_SIZE,
          );
          if (rows.length === 0) break;

          const groups = new Map<string, ArchiveRow[]>();
          for (const row of rows) {
            const key = row.retailer ?? "global";
            groups.set(key, [...(groups.get(key) ?? []), row]);
          }

          for (const [group, groupRows] of groups) {
            const retailer = group === "global" ? null : group;
            const part = parts.get(group) ?? 0;
            parts.set(group, part + 1);
            const key = archiveObjectKey(dataset, retailer, window, part);
            const compressed = await gzipText(serializeRows(dataset, groupRows));
            const object: ArchiveObjectRecord = {
              key,
              dataset,
              retailer,
              recordCount: groupRows.length,
              compressedBytes: compressed.byteLength,
              sha256: await sha256Hex(compressed),
              window,
            };

            await this.bucket.put(key, compressed, {
              httpMetadata: {
                contentType: "application/x-ndjson",
                contentEncoding: "gzip",
              },
              customMetadata: {
                schemaVersion: "1",
                dataset,
                retailer: retailer ?? "global",
                windowStart: window.start,
                windowEnd: window.end,
                recordCount: String(groupRows.length),
                sha256: object.sha256,
              },
            });
            await this.runs.recordObject(runId, object);
            objectCount += 1;
            recordCount += groupRows.length;
          }

          const last = rows.at(-1)!;
          afterTimestamp = last.timestamp;
          afterId = last.id;
          if (rows.length < PAGE_SIZE) break;
        }
      }

      await this.runs.complete(runId, this.clock(), objectCount, recordCount);
      await this.writeDayManifest(window);
      return true;
    } catch (error) {
      await this.runs.fail(runId, this.clock(), String(error).slice(0, 1000));
      throw error;
    }
  }

  private async writeDayManifest(window: ArchiveWindow): Promise<void> {
    const start = new Date(window.start);
    const dayStart = new Date(Date.UTC(
      start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(),
    ));
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);
    const objects = await this.runs.listDayObjects(
      dayStart.toISOString(),
      dayEnd.toISOString(),
    );
    const manifest: ArchiveManifest = {
      schemaVersion: 1,
      day: dayStart.toISOString().slice(0, 10),
      completeThrough: window.end,
      complete: new Date(window.end).getTime() === dayEnd.getTime(),
      generatedAt: this.clock(),
      objects,
      totals: {
        objects: objects.length,
        records: objects.reduce((sum, object) => sum + object.recordCount, 0),
        compressedBytes: objects.reduce(
          (sum, object) => sum + object.compressedBytes, 0,
        ),
      },
    };
    await this.bucket.put(manifestKey(dayStart.toISOString()), JSON.stringify(manifest, null, 2), {
      httpMetadata: { contentType: "application/json" },
    });
  }
}

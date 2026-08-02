import assert from "node:assert/strict";
import test from "node:test";

import {
  archiveObjectKey,
  closedHourWindow,
  HistoricalArchiveService,
} from "../../src/archive/archive-service.ts";
import type {
  ArchiveObjectRecord,
  ArchiveRow,
  ArchiveWindow,
} from "../../src/archive/types.ts";

class MemorySource {
  async earliestSourceTimestamp(): Promise<string | null> {
    return "2026-08-02T18:15:00.000Z";
  }
  async readPage(
    dataset: string,
    _window: ArchiveWindow,
    afterTimestamp: string | null,
  ): Promise<ArchiveRow[]> {
    if (dataset !== "observations" || afterTimestamp !== null) return [];
    return [
      {
        id: "observation-1",
        retailer: "amazon-us",
        timestamp: "2026-08-02T18:15:00.000Z",
        payload: { id: "observation-1", availability: "IN_STOCK" },
      },
      {
        id: "observation-2",
        retailer: "amazon-us",
        timestamp: "2026-08-02T18:16:00.000Z",
        payload: { id: "observation-2", availability: "OUT_OF_STOCK" },
      },
    ];
  }
}

class MemoryRuns {
  claimed = false;
  failed: string | null = null;
  completed: { objects: number; records: number } | null = null;
  readonly objects: ArchiveObjectRecord[] = [];

  async earliestArchivedStart(): Promise<string | null> {
    return this.claimed ? "2026-08-02T18:00:00.000Z" : null;
  }

  async claim(): Promise<boolean> {
    if (this.claimed) return false;
    this.claimed = true;
    return true;
  }
  async recordObject(_runId: string, object: ArchiveObjectRecord): Promise<void> {
    this.objects.push(object);
  }
  async complete(
    _runId: string,
    _completedAt: string,
    objects: number,
    records: number,
  ): Promise<void> {
    this.completed = { objects, records };
  }
  async fail(_runId: string, _completedAt: string, error: string): Promise<void> {
    this.failed = error;
  }
  async listDayObjects(): Promise<ArchiveObjectRecord[]> {
    return this.objects;
  }
}

class MemoryBucket {
  readonly objects = new Map<string, ArrayBuffer | ArrayBufferView | string>();
  async put(key: string, value: ArrayBuffer | ArrayBufferView | string): Promise<void> {
    this.objects.set(key, value);
  }
}

test("computes the previous closed UTC hour", () => {
  assert.deepEqual(
    closedHourWindow(Date.parse("2026-08-02T19:07:00.000Z")),
    {
      start: "2026-08-02T18:00:00.000Z",
      end: "2026-08-02T19:00:00.000Z",
    },
  );
});

test("builds stable retailer and date partitioned keys", () => {
  assert.equal(
    archiveObjectKey(
      "observations",
      "amazon-us",
      {
        start: "2026-08-02T18:00:00.000Z",
        end: "2026-08-02T19:00:00.000Z",
      },
      2,
    ),
    "v1/observations/retailer=amazon-us/year=2026/month=08/day=02/hour=18/part-00002.ndjson.gz",
  );
});

test("writes compressed observations, checksums, and a daily manifest idempotently", async () => {
  const runs = new MemoryRuns();
  const bucket = new MemoryBucket();
  const service = new HistoricalArchiveService(
    new MemorySource(),
    runs,
    bucket,
    () => "2026-08-02T19:07:01.000Z",
  );
  const window = closedHourWindow(Date.parse("2026-08-02T19:07:00.000Z"));

  assert.equal(await service.archive(window), true);
  assert.deepEqual(runs.completed, { objects: 1, records: 2 });
  assert.equal(runs.failed, null);
  assert.equal(runs.objects[0]?.sha256.length, 64);
  assert.equal(runs.objects[0]?.recordCount, 2);
  assert.equal(bucket.objects.size, 2);

  const compressed = bucket.objects.get(runs.objects[0]!.key);
  assert.ok(compressed && typeof compressed !== "string");
  const bytes = compressed instanceof ArrayBuffer
    ? new Uint8Array(compressed)
    : new Uint8Array(compressed.buffer, compressed.byteOffset, compressed.byteLength);
  const decoded = await new Response(
    new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")),
  ).text();
  const rows = decoded.trim().split("\n").map((line) => JSON.parse(line));
  assert.equal(rows.length, 2);
  assert.equal(rows[0].dataset, "observations");
  assert.equal(rows[0].availability, "IN_STOCK");

  const manifest = bucket.objects.get(
    "manifests/year=2026/month=08/day=02/manifest.json",
  );
  assert.equal(typeof manifest, "string");
  const parsed = JSON.parse(manifest as string);
  assert.equal(parsed.totals.records, 2);
  assert.equal(parsed.complete, false);

  assert.equal(await service.archive(window), false);
  assert.equal(bucket.objects.size, 2);
});

test("records archive failures without claiming success", async () => {
  const runs = new MemoryRuns();
  const service = new HistoricalArchiveService(
    new MemorySource(),
    runs,
    { async put() { throw new Error("R2 unavailable"); } },
    () => "2026-08-02T19:07:01.000Z",
  );

  await assert.rejects(
    service.archive(closedHourWindow(Date.parse("2026-08-02T19:07:00.000Z"))),
    /R2 unavailable/,
  );
  assert.match(runs.failed ?? "", /R2 unavailable/);
  assert.equal(runs.completed, null);
});

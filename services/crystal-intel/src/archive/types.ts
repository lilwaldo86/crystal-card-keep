export interface ArchiveWindow {
  start: string;
  end: string;
}

export interface ArchiveRow {
  id: string;
  retailer: string | null;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface ArchiveObjectRecord {
  key: string;
  dataset: string;
  retailer: string | null;
  recordCount: number;
  compressedBytes: number;
  sha256: string;
  window: ArchiveWindow;
}

export interface ArchiveManifest {
  schemaVersion: 1;
  day: string;
  completeThrough: string;
  complete: boolean;
  generatedAt: string;
  objects: ArchiveObjectRecord[];
  totals: {
    objects: number;
    records: number;
    compressedBytes: number;
  };
}

export interface ArchiveDataSource {
  earliestSourceTimestamp(): Promise<string | null>;
  readPage(
    dataset: string,
    window: ArchiveWindow,
    afterTimestamp: string | null,
    afterId: string | null,
    limit: number,
  ): Promise<ArchiveRow[]>;
}

export interface ArchiveRunStore {
  earliestArchivedStart(): Promise<string | null>;
  claim(runId: string, window: ArchiveWindow, startedAt: string): Promise<boolean>;
  recordObject(runId: string, object: ArchiveObjectRecord): Promise<void>;
  complete(
    runId: string,
    completedAt: string,
    objectCount: number,
    recordCount: number,
  ): Promise<void>;
  fail(runId: string, completedAt: string, error: string): Promise<void>;
  listDayObjects(dayStart: string, dayEnd: string): Promise<ArchiveObjectRecord[]>;
}

export interface ArchiveBucket {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | string,
    options?: R2PutOptions,
  ): Promise<unknown>;
}

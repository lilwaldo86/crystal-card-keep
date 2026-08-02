# Crystal Intel historical archive

Crystal Intel keeps D1 as the operational database and writes immutable, compressed historical batches to the `crystal-intel-archive` R2 bucket.

## Schedule and isolation

- The archive runs at minute 7 of every hour (`7 * * * *`).
- Each run exports only the previous fully closed UTC hour.
- Monitoring and discovery use separate cron invocations.
- Archive failures are recorded in `archive_runs` and diagnostics, then contained. They do not fail monitoring, discovery, orchestration, or alert delivery.
- Failed or stale archive runs can be retried. Deterministic object keys make replay safe.
- Each hourly invocation backfills up to four older hours, gradually preserving the existing D1 history without a one-time load spike.

## Format

Records are newline-delimited JSON compressed with gzip. Objects use a versioned retailer/date partition:

```text
v1/observations/retailer=amazon-us/year=2026/month=08/day=02/hour=18/part-00000.ndjson.gz
```

Each object has custom metadata containing its dataset, retailer, UTC window, record count, schema version, and SHA-256 checksum. A daily JSON manifest is updated after each successful hourly export:

```text
manifests/year=2026/month=08/day=02/manifest.json
```

## Archived datasets

- legacy monitoring observations
- discovery runs and candidates
- unified listing observations
- orchestration jobs and audit events
- intelligence alerts and internal notification events

Raw retailer HTML is not archived. The normalized record, page fingerprint, classification, timing, availability, price, and other structured fields remain available without permanently retaining redundant copyrighted page bodies.

## Retention

No lifecycle expiration rule should be attached to this bucket. The normalized archive is intended to be retained indefinitely. Bucket-lock configuration is a separate operational decision because an indefinite lock prevents emergency deletion and can create unavoidable storage charges.

## Required deployment gate

1. Create the R2 bucket `crystal-intel-archive`.
2. Apply additive migration `0009_r2_historical_archive.sql`.
3. Deploy initially with `ARCHIVE_ENABLED=false` and `ARCHIVE_BACKFILL_HOURS_PER_RUN=0`.
4. Verify the `ARCHIVE_BUCKET` binding and deploy only after typecheck, tests, and Wrangler dry-run pass.
5. Enable one controlled closed-hour archive with backfill still set to zero.
6. Verify `archive_runs`, `archive_objects`, the gzip object, its SHA-256 metadata, and the daily manifest.
7. Increase backfill gradually only after monitoring Worker runtime, D1 load, Queue health, and object integrity.
8. Do not configure a deletion lifecycle rule.

## Rollback

Disable `ARCHIVE_ENABLED` or restore the prior Worker version. Leave the additive D1 tables and existing R2 objects intact. Do not delete archived data as part of an application rollback.

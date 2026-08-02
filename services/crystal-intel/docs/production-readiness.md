# Crystal Intel production-readiness gate

This checklist prepares the consolidated Crystal Intel foundation for review. It does not authorize a push, migration, or deployment.

## Verified locally

- TypeScript compilation completes with no errors.
- Unit and integration tests cover catalog identity, retailer adapters, discovery, orchestration, observations, alerts, configuration, and concurrent replay.
- Migrations `0001` through `0009` apply in order and can be rerun safely.
- `PRAGMA foreign_key_check` reports no violations after migration and rollback/reapply verification.
- Migration `0008` tables can be removed in reverse dependency order and reapplied.
- The one-minute live monitor schedule and five-minute discovery schedule remain distinct.
- Discovery remains review-gated; external alert delivery remains unchanged.
- The hourly R2 archive processes only closed UTC windows and cannot interrupt monitoring or discovery on failure.

## Required before first push

1. Confirm the intended development branch and clean working tree.
2. Run `npm ci` on the target operating system to install the correct native Cloudflare tooling.
3. Run `npm run typecheck`, `npm test`, and `npx wrangler deploy --dry-run`.
4. Inspect the generated bundle for unexpected bindings or secrets.
5. Commit only the reviewed Crystal Intel service files.
6. Push the development branch only after the separate architect push gate.

## Required before any remote migration or deployment

1. Export or back up the target D1 database.
2. Confirm bindings, queue names, database ID, cron triggers, and environment variables for the target environment.
3. Apply migrations to a non-production database first.
4. Verify `/health`, scheduled discovery, candidate review, listing creation, observation recording, and internal notification events.
5. Confirm replay does not duplicate jobs, observations, alerts, or notification events.
6. Obtain a separate production deployment authorization.
7. For archive-enabled releases, verify the R2 bucket, binding, first gzip object, checksum metadata, and daily manifest.

## Rollback guidance

Application rollback should restore the previously approved Worker bundle. Database migrations are additive, so the preferred database response is a forward correction while leaving unused tables intact.

If migration `0008` must be reversed before it contains production data, remove its tables in dependency order:

```sql
DROP TABLE notification_events;
DROP TABLE intelligence_alerts;
```

If those tables contain data, preserve it before any destructive rollback. Never remove earlier catalog, discovery, or orchestration tables as part of an alert-engine rollback.

## Known verification limitation

The review environment contains the Windows native `workerd` package while running on Linux, so the Wrangler dry-run must be repeated after a clean target-platform dependency installation. Static typecheck, tests, migration verification, and archive verification are unaffected.

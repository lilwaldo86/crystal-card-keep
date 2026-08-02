import {
  booleanToInteger,
  retailerAdapters,
  sha256,
} from "./retailers/index.ts";
import {
  ListingObservationRepository,
  ProductIdentifierRepository,
  RetailerListingRepository,
} from "./catalog/repositories/index";
import { ProductMatchingService } from "./catalog/product-matching-service.ts";
import { DiscoveryEngine } from "./discovery/discovery-engine";
import {
  DiscoveryCandidateRepository,
  DiscoveryRunRepository,
} from "./discovery/repositories/index";
import {
  AuditEventRepository,
  InternalOrchestrator,
  OrchestrationJobRepository,
} from "./orchestration/index";
import {
  AlertEngine,
  AlertRepository,
} from "./alerts/index";
import type {
  NormalizedRetailerPayload,
  RetailerAdapter,
  RetailerAvailability,
} from "./retailers/index.ts";
import {
  assertRuntimeConfiguration,
  errorMessage,
  recordDiagnostic,
  validateRuntimeConfiguration,
} from "./runtime/index";
import {
  closedHourWindow,
  D1ArchiveRepository,
  HistoricalArchiveService,
} from "./archive/index.ts";

interface Env {
  DB: D1Database;
  MONITOR_QUEUE: Queue<Job>;
  AMAZON_MARKETPLACE: string;
  MONITOR_ENABLED: string;
  DAILY_PHASE_STEP_SECONDS: string;
  BASE_BLOCK_RETRY_SECONDS: string;
  MAX_BLOCK_RETRY_SECONDS: string;
  DISCOVERY_ENABLED: string;
  AMAZON_DISCOVERY_URL: string;
  AMAZON_DISCOVERY_QUERY: string;
  ARCHIVE_BUCKET: R2Bucket;
  ARCHIVE_ENABLED: string;
  ARCHIVE_BACKFILL_HOURS_PER_RUN: string;
  ADMIN_TOKEN?: string;
  DISCORD_WEBHOOK_URL?: string;
}

interface Job {
  id: string;
  monitorId: string;
  asin: string;
  url: string;
  retailer?: string;
  kind: "SCHEDULED" | "BLOCK_RETRY" | "MANUAL";
  intendedAt: string;
  phaseOffsetSeconds: number;
  attemptNumber: number;
}

interface Monitor {
  id: string;
  enabled: number;
  mode: "HEALTHY" | "RETRY" | "PAUSED";
  consecutive_blocks: number;
  lease_until: string | null;
}

interface MonitoredProduct {
  external_id: string;
  canonical_url: string;
}

interface Previous {
  id: string;
  availability: RetailerAvailability;
  price_cents: number | null;
  sold_by_amazon: number | null;
  ships_from_amazon: number | null;
}

const now = (): string => new Date().toISOString();
const DISCOVERY_CRON = "*/5 * * * *";
const ARCHIVE_CRON = "7 * * * *";

const phase = (date: Date, step: number): number => {
  const day = Math.floor(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ) / 86400000,
  );

  return (day * Math.max(1, Math.min(59, step))) % 60;
};

async function note(
  env: Env,
  monitorId: string | null,
  observationId: string | null,
  category: string,
  noteText: string,
  numericValue: number | null = null,
  unit: string | null = null,
): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO engineering_notes VALUES(?,?,?,?,?,?,?,?)",
  )
    .bind(
      crypto.randomUUID(),
      monitorId,
      observationId,
      category,
      noteText,
      numericValue,
      unit,
      now(),
    )
    .run();
}

async function monitor(
  env: Env,
  adapter: RetailerAdapter,
  externalId: string,
  url: string,
): Promise<Monitor> {
  const id = `${adapter.retailerId}:${externalId}`;
  const timestamp = now();

  await env.DB.prepare(
    "INSERT OR IGNORE INTO monitors(id,retailer,external_id,canonical_url,enabled,mode,created_at,updated_at) VALUES(?,?,?,?,1,'HEALTHY',?,?)",
  )
    .bind(
      id,
      adapter.retailerId,
      externalId,
      url,
      timestamp,
      timestamp,
    )
    .run();

  await env.DB.prepare(
    "UPDATE monitors SET canonical_url=?,updated_at=? WHERE id=?",
  )
    .bind(url, timestamp, id)
    .run();

  const result = await env.DB.prepare(
    "SELECT * FROM monitors WHERE id=?",
  )
    .bind(id)
    .first<Monitor>();

  if (!result) {
    throw new Error(
      `Monitor unavailable for ${adapter.retailerId}:${externalId}`,
    );
  }

  return result;
}

async function createJob(env: Env, job: Job): Promise<boolean> {
  const result = await env.DB.prepare(
    "INSERT OR IGNORE INTO monitor_jobs(id,monitor_id,job_kind,intended_at,enqueued_at,status,attempt_number) VALUES(?,?,?,?,?,'QUEUED',?)",
  )
    .bind(
      job.id,
      job.monitorId,
      job.kind,
      job.intendedAt,
      now(),
      job.attemptNumber,
    )
    .run();

  return (result.meta.changes ?? 0) === 1;
}

async function lease(env: Env, id: string): Promise<boolean> {
  const timestamp = now();
  const until = new Date(Date.now() + 45000).toISOString();

  const result = await env.DB.prepare(
    "UPDATE monitors SET lease_until=?,last_attempt_at=?,updated_at=? WHERE id=? AND enabled=1 AND (lease_until IS NULL OR lease_until<?)",
  )
    .bind(until, timestamp, timestamp, id, timestamp)
    .run();

  return (result.meta.changes ?? 0) === 1;
}

async function alert(
  env: Env,
  adapter: RetailerAdapter,
  job: Job,
  parsed: NormalizedRetailerPayload,
  observedAt: string,
  observationId: string,
  latency: number,
): Promise<void> {
  if (!env.DISCORD_WEBHOOK_URL) {
    return;
  }

  const alertId = crypto.randomUUID();
  const timestamp = now();

  await env.DB.prepare(
    "INSERT INTO alert_events(id,observation_id,channel,created_at,status) VALUES(?,?,'discord',?,'CREATED')",
  )
    .bind(alertId, observationId, timestamp)
    .run();

  const body = {
    content: [
      `🚨 **${adapter.displayName.toUpperCase()} RESTOCK DETECTED**`,
      `**${parsed.productName ?? `Amazon ASIN ${job.asin}`}**`,
      `Status: **${parsed.availability.replaceAll("_", " ")}**`,
      `Price: **${
        parsed.priceCents === null
          ? "Unknown"
          : `$${(parsed.priceCents / 100).toFixed(2)}`
      }**`,
      `Observed: **${observedAt}**`,
      `${adapter.displayName} response: **${latency} ms**`,
      job.url,
      "_Availability can change quickly. Crystal Intel cannot reserve inventory._",
    ].join("\n"),
  };

  const submittedAt = now();

  try {
    const response = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    await env.DB.prepare(
      "UPDATE alert_events SET submitted_at=?,provider_accepted_at=?,status=?,provider_status=? WHERE id=?",
    )
      .bind(
        submittedAt,
        now(),
        response.ok ? "ACCEPTED" : "FAILED",
        response.status,
        alertId,
      )
      .run();
  } catch (error) {
    await env.DB.prepare(
      "UPDATE alert_events SET submitted_at=?,status='FAILED',error_message=? WHERE id=?",
    )
      .bind(submittedAt, String(error).slice(0, 500), alertId)
      .run();
  }
}

async function run(env: Env, job: Job): Promise<void> {
  const adapter = retailerAdapters.get(job.retailer ?? "amazon-us");
  const currentMonitor = await env.DB.prepare(
    "SELECT * FROM monitors WHERE id=?",
  )
    .bind(job.monitorId)
    .first<Monitor>();

  if (
    !currentMonitor ||
    !currentMonitor.enabled ||
    currentMonitor.mode === "PAUSED"
  ) {
    return;
  }

  if (!(await lease(env, job.monitorId))) {
    await note(
      env,
      job.monitorId,
      null,
      "lease_collision",
      "A second timing path was prevented.",
    );

    return;
  }

  await env.DB.prepare(
    "UPDATE monitor_jobs SET status='RUNNING',started_at=? WHERE id=?",
  )
    .bind(now(), job.id)
    .run();

  const observedAt = now();

  try {
    const fetched = await adapter.fetchListing(job.url);
    const parsed = adapter.parse(fetched.status, fetched.body);
    const observationId = crypto.randomUUID();

    const previous = await env.DB.prepare(
      "SELECT id,availability,price_cents,sold_by_amazon,ships_from_amazon FROM observations WHERE monitor_id=? AND response_classification='PRODUCT_PAGE' ORDER BY observed_at DESC LIMIT 1",
    )
      .bind(job.monitorId)
      .first<Previous>();

    const availabilityChanged =
      Boolean(previous) &&
      previous?.availability !== parsed.availability;

    const priceChanged =
      Boolean(previous) &&
      previous?.price_cents !== parsed.priceCents;

    const sellerChanged =
      Boolean(previous) &&
      (previous?.sold_by_amazon !==
        booleanToInteger(parsed.soldByRetailer) ||
        previous?.ships_from_amazon !==
          booleanToInteger(parsed.shipsFromRetailer));

    const alertRequired =
      availabilityChanged &&
      ["IN_STOCK", "LIMITED_STOCK", "PREORDER"].includes(
        parsed.availability,
      );

    await env.DB.prepare(
      `INSERT INTO observations(
        id,
        monitor_id,
        job_id,
        observed_at,
        intended_at,
        retailer,
        external_id,
        canonical_url,
        product_name,
        price_cents,
        currency,
        availability,
        availability_text,
        displayed_remaining_quantity,
        purchase_limit,
        sold_by_amazon,
        ships_from_amazon,
        http_status,
        response_time_ms,
        response_size_bytes,
        response_classification,
        page_fingerprint,
        worker_colo,
        phase_offset_seconds,
        scraper_version,
        availability_changed,
        price_changed,
        seller_changed,
        alert_required,
        previous_observation_id,
        created_at
      ) VALUES(
        ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
      )`,
    )
      .bind(
        observationId,
        job.monitorId,
        job.id,
        observedAt,
        job.intendedAt,
        adapter.retailerId,
        job.asin,
        job.url,
        parsed.productName,
        parsed.priceCents,
        parsed.currency,
        parsed.availability,
        parsed.availabilityText,
        parsed.displayedRemainingQuantity,
        parsed.purchaseLimit,
        booleanToInteger(parsed.soldByRetailer),
        booleanToInteger(parsed.shipsFromRetailer),
        fetched.status,
        fetched.latencyMs,
        fetched.responseSizeBytes,
        parsed.classification,
        await sha256(fetched.body),
        fetched.workerColo,
        job.phaseOffsetSeconds,
        adapter.scraperVersion,
        availabilityChanged ? 1 : 0,
        priceChanged ? 1 : 0,
        sellerChanged ? 1 : 0,
        alertRequired ? 1 : 0,
        previous?.id ?? null,
        now(),
      )
      .run();

    await note(
      env,
      job.monitorId,
      observationId,
      adapter.responseLatencyNoteCategory,
      `Response classified as ${parsed.classification}.`,
      fetched.latencyMs,
      "milliseconds",
    );

    if (
      ["BLOCKED", "CAPTCHA", "RATE_LIMITED"].includes(
        parsed.classification,
      )
    ) {
      const consecutiveBlocks = currentMonitor.consecutive_blocks + 1;
      const baseRetry =
        Number.parseInt(env.BASE_BLOCK_RETRY_SECONDS, 10) || 30;
      const maximumRetry =
        Number.parseInt(env.MAX_BLOCK_RETRY_SECONDS, 10) || 1800;
      const delay = Math.min(
        maximumRetry,
        baseRetry * consecutiveBlocks,
      );

      const retryAt = new Date(
        Date.now() + delay * 1000,
      ).toISOString();

      await env.DB.batch([
        env.DB.prepare(
          "UPDATE monitors SET mode='RETRY',consecutive_blocks=?,retry_not_before=?,last_blocked_at=?,lease_until=NULL,updated_at=? WHERE id=?",
        ).bind(
          consecutiveBlocks,
          retryAt,
          now(),
          now(),
          job.monitorId,
        ),
        env.DB.prepare(
          "UPDATE monitor_jobs SET status='BLOCKED',completed_at=?,error_code=? WHERE id=?",
        ).bind(now(), parsed.classification, job.id),
      ]);

      const retryJob: Job = {
        ...job,
        id: `retry:${job.monitorId}:${retryAt}:${
          job.attemptNumber + 1
        }`,
        kind: "BLOCK_RETRY",
        intendedAt: retryAt,
        phaseOffsetSeconds: 0,
        attemptNumber: job.attemptNumber + 1,
      };

      if (await createJob(env, retryJob)) {
        await env.MONITOR_QUEUE.send(retryJob, {
          delaySeconds: delay,
        });
      }

      await note(
        env,
        job.monitorId,
        observationId,
        "block_retry_interval",
        `Block ${consecutiveBlocks}; retry in ${delay} seconds.`,
        delay,
        "seconds",
      );

      return;
    }

    await env.DB.batch([
      env.DB.prepare(
        "UPDATE monitors SET mode='HEALTHY',consecutive_blocks=0,retry_not_before=NULL,last_success_at=?,last_observation_id=?,lease_until=NULL,updated_at=? WHERE id=?",
      ).bind(now(), observationId, now(), job.monitorId),
      env.DB.prepare(
        "UPDATE monitor_jobs SET status='SUCCEEDED',completed_at=? WHERE id=?",
      ).bind(now(), job.id),
    ]);

    if (alertRequired) {
      const alertStarted = performance.now();

      await alert(
        env,
        adapter,
        job,
        parsed,
        observedAt,
        observationId,
        fetched.latencyMs,
      );

      await note(
        env,
        job.monitorId,
        observationId,
        "observation_to_alert_submission",
        "Elapsed alert submission time.",
        Math.round(performance.now() - alertStarted),
        "milliseconds",
      );
    }
  } catch (error) {
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE monitors SET lease_until=NULL,updated_at=? WHERE id=?",
      ).bind(now(), job.monitorId),
      env.DB.prepare(
        "UPDATE monitor_jobs SET status='FAILED',completed_at=?,error_code='FETCH_OR_PROCESSING_ERROR',error_message=? WHERE id=?",
      ).bind(now(), String(error).slice(0, 500), job.id),
    ]);

    throw error;
  }
}

function auth(request: Request, env: Env): boolean {
  const suppliedToken =
    request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "") ?? "";

  return Boolean(env.ADMIN_TOKEN) && suppliedToken === env.ADMIN_TOKEN;
}

function createInternalOrchestrator(env: Env): InternalOrchestrator {
  const discoveryCandidates = new DiscoveryCandidateRepository(env.DB);
  const discovery = new DiscoveryEngine(
    retailerAdapters,
    new ProductMatchingService(
      new ProductIdentifierRepository(env.DB),
    ),
    new DiscoveryRunRepository(env.DB),
    discoveryCandidates,
  );

  return new InternalOrchestrator(
    discovery,
    discoveryCandidates,
    new RetailerListingRepository(env.DB),
    new ListingObservationRepository(env.DB),
    new OrchestrationJobRepository(env.DB),
    new AuditEventRepository(env.DB),
    undefined,
    new AlertEngine(new AlertRepository(env.DB)),
  );
}

async function runDiscoveryCycle(
  env: Env,
  scheduledTime: number,
): Promise<void> {
  if (env.DISCOVERY_ENABLED.toLowerCase() !== "true") {
    return;
  }

  const scheduledAt = new Date(scheduledTime).toISOString();
  const orchestrator = createInternalOrchestrator(env);

  try {
    await orchestrator.runDiscovery({
      id: `amazon-us:url-scan:${scheduledAt}`,
      retailerId: "amazon-us",
      kind: "URL_SCAN",
      sourceUrl: env.AMAZON_DISCOVERY_URL,
      query: env.AMAZON_DISCOVERY_QUERY,
    });
  } catch (error) {
    recordDiagnostic({
      level: "ERROR",
      event: "DISCOVERY_CYCLE_FAILED",
      scheduledAt,
      error: errorMessage(error),
    });
  }

  await orchestrator.processApprovedCandidates(100);
}

async function runArchiveCycle(
  env: Env,
  scheduledTime: number,
): Promise<void> {
  if (env.ARCHIVE_ENABLED.toLowerCase() !== "true") {
    return;
  }

  const window = closedHourWindow(scheduledTime);
  const repository = new D1ArchiveRepository(env.DB);
  const archive = new HistoricalArchiveService(
    repository,
    repository,
    env.ARCHIVE_BUCKET,
  );

  try {
    await archive.archive(window);

    const earliestSource = await repository.earliestSourceTimestamp();
    let cursor = await repository.earliestArchivedStart();
    const backfillLimit = Number.parseInt(
      env.ARCHIVE_BACKFILL_HOURS_PER_RUN,
      10,
    ) || 0;

    for (
      let count = 0;
      earliestSource && cursor && count < backfillLimit;
      count += 1
    ) {
      const end = new Date(cursor);
      const start = new Date(end.getTime() - 3_600_000);
      if (end.getTime() <= new Date(earliestSource).getTime()) break;
      await archive.archive({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      cursor = start.toISOString();
    }
  } catch (error) {
    recordDiagnostic({
      level: "ERROR",
      event: "HISTORICAL_ARCHIVE_FAILED",
      windowStart: window.start,
      windowEnd: window.end,
      error: errorMessage(error),
    });
  }
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
  ): Promise<void> {
    assertRuntimeConfiguration(env);

    if (controller.cron === ARCHIVE_CRON) {
      await runArchiveCycle(env, controller.scheduledTime);
      return;
    }

    if (controller.cron === DISCOVERY_CRON) {
      await runDiscoveryCycle(env, controller.scheduledTime);
      return;
    }

    if (env.MONITOR_ENABLED.toLowerCase() !== "true") {
      return;
    }

    const scheduledDate = new Date(controller.scheduledTime);
    const adapter = retailerAdapters.get("amazon-us");
    const phaseOffset = phase(
      scheduledDate,
      Number.parseInt(env.DAILY_PHASE_STEP_SECONDS, 10) || 5,
    );

    const products = await env.DB.prepare(
      `SELECT external_id, canonical_url
       FROM monitored_products
       WHERE retailer='amazon-us'
         AND enabled=1
       ORDER BY priority, id`,
    ).all<MonitoredProduct>();

    for (const product of products.results) {
      const asin = adapter.normalizeExternalId(product.external_id);

      if (!adapter.isValidExternalId(asin)) {
        await note(
          env,
          null,
          null,
          "invalid_product_external_id",
          `Skipped invalid Amazon ASIN: ${product.external_id}`,
        );

        continue;
      }

      const url =
        product.canonical_url ||
        adapter.canonicalUrl(asin, env.AMAZON_MARKETPLACE);

      const currentMonitor = await monitor(env, adapter, asin, url);

      if (currentMonitor.mode !== "HEALTHY") {
        await note(
          env,
          currentMonitor.id,
          null,
          "scheduled_skip",
          `Skipped while mode=${currentMonitor.mode}.`,
        );

        continue;
      }

      const intendedDate = new Date(scheduledDate);
      intendedDate.setUTCSeconds(phaseOffset, 0);
      const intendedAt = intendedDate.toISOString();

      const job: Job = {
        id: `scheduled:${currentMonitor.id}:${intendedAt}`,
        monitorId: currentMonitor.id,
        asin,
        url,
        retailer: adapter.retailerId,
        kind: "SCHEDULED",
        intendedAt,
        phaseOffsetSeconds: phaseOffset,
        attemptNumber: 1,
      };

      if (await createJob(env, job)) {
        await env.MONITOR_QUEUE.send(job, {
          delaySeconds: phaseOffset,
        });
      }
    }
  },

  async queue(batch: MessageBatch<Job>, env: Env): Promise<void> {
    assertRuntimeConfiguration(env);

    for (const message of batch.messages) {
      try {
        await run(env, message.body);
        message.ack();
      } catch (error) {
        recordDiagnostic({
          level: "ERROR",
          event: "MONITOR_QUEUE_JOB_FAILED",
          jobId: message.body.id,
          monitorId: message.body.monitorId,
          error: errorMessage(error),
        });
        message.retry({
          delaySeconds: 30,
        });
      }
    }
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      const configuration = validateRuntimeConfiguration(env);
      return Response.json({
        service: "crystal-intel-amazon-beta",
        status: configuration.valid ? "ok" : "configuration_error",
        configurationValid: configuration.valid,
        now: now(),
      }, { status: configuration.valid ? 200 : 503 });
    }

    if (!auth(request, env)) {
      return Response.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    if (url.pathname === "/api/products") {
      const products = await env.DB.prepare(
        `SELECT
           id,
           retailer,
           external_id,
           canonical_url,
           enabled,
           priority,
           created_at,
           updated_at
         FROM monitored_products
         ORDER BY priority, id`,
      ).all();

      return Response.json(products.results);
    }

    if (url.pathname === "/api/status") {
      const status = await env.DB.prepare(
        `SELECT
           id,
           external_id,
           enabled,
           mode,
           consecutive_blocks,
           retry_not_before,
           last_attempt_at,
           last_success_at,
           last_blocked_at
         FROM monitors
         ORDER BY id`,
      ).all();

      return Response.json(status.results);
    }

    if (url.pathname === "/api/observations") {
      const limit = Math.max(
        1,
        Math.min(
          200,
          Number.parseInt(url.searchParams.get("limit") ?? "50", 10),
        ),
      );

      const observations = await env.DB.prepare(
        `SELECT
           observed_at,
           external_id,
           product_name,
           price_cents,
           availability,
           availability_text,
           http_status,
           response_time_ms,
           response_classification,
           worker_colo,
           phase_offset_seconds,
           availability_changed,
           price_changed,
           alert_required
         FROM observations
         ORDER BY observed_at DESC
         LIMIT ?`,
      )
        .bind(limit)
        .all();

      return Response.json(observations.results);
    }

    if (url.pathname === "/api/notes") {
      const notes = await env.DB.prepare(
        `SELECT
           created_at,
           monitor_id,
           category,
           note,
           numeric_value,
           unit
         FROM engineering_notes
         ORDER BY created_at DESC
         LIMIT 100`,
      ).all();

      return Response.json(notes.results);
    }

    return Response.json(
      {
        error: "Not found",
      },
      {
        status: 404,
      },
    );
  },
} satisfies ExportedHandler<Env, Job>;

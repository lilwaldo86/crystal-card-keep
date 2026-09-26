type Availability =
  | "IN_STOCK"
  | "LIMITED_STOCK"
  | "OUT_OF_STOCK"
  | "PREORDER"
  | "UNAVAILABLE"
  | "UNKNOWN";

import { handleStorefrontRequest } from "./storefront";

type Classification =
  | "PRODUCT_PAGE"
  | "BLOCKED"
  | "CAPTCHA"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNEXPECTED_PAGE";

interface Env {
  DB: D1Database;
  MONITOR_QUEUE: Queue<Job>;
  AMAZON_MARKETPLACE: string;
  MONITOR_ENABLED: string;
  DAILY_PHASE_STEP_SECONDS: string;
  BASE_BLOCK_RETRY_SECONDS: string;
  MAX_BLOCK_RETRY_SECONDS: string;
  ADMIN_TOKEN?: string;
  DISCORD_WEBHOOK_URL?: string;
  SQUARE_ENVIRONMENT: "sandbox" | "production";
  SQUARE_APPLICATION_ID: string;
  SQUARE_LOCATION_ID: string;
  SQUARE_ACCESS_TOKEN?: string;
  SQUARE_WEBHOOK_SIGNATURE_KEY?: string;
  SQUARE_API_VERSION: string;
  SQUARE_WEBHOOK_URL?: string;
  STOREFRONT_ORIGIN: string;
  CHECKOUT_ENABLED?: string;
  TAX_MODE?: "disabled" | "fixed";
  SALES_TAX_BASIS_POINTS?: string;
  ASSET_PUBLIC_BASE_URL?: string;
}

interface Job {
  id: string;
  monitorId: string;
  asin: string;
  url: string;
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

interface Parsed {
  classification: Classification;
  productName: string | null;
  priceCents: number | null;
  availability: Availability;
  availabilityText: string | null;
  displayedRemainingQuantity: number | null;
  purchaseLimit: number | null;
  soldByAmazon: boolean | null;
  shipsFromAmazon: boolean | null;
}

interface Previous {
  id: string;
  availability: Availability;
  price_cents: number | null;
  sold_by_amazon: number | null;
  ships_from_amazon: number | null;
}

const now = (): string => new Date().toISOString();

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

const strip = (value: string): string =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const match = (html: string, patterns: RegExp[]): string | null => {
  for (const pattern of patterns) {
    const result = pattern.exec(html);

    if (result?.[1]) {
      return strip(result[1]);
    }
  }

  return null;
};

const cents = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));

  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
};

const bool = (value: boolean | null): number | null =>
  value === null ? null : value ? 1 : 0;

async function hash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function parse(status: number, html: string): Parsed {
  const lowercase = html.toLowerCase();

  let classification: Classification =
    status === 429
      ? "RATE_LIMITED"
      : status >= 500
        ? "SERVER_ERROR"
        : lowercase.includes("enter the characters you see below") ||
            lowercase.includes("/errors/validatecaptcha")
          ? "CAPTCHA"
          : status === 403 ||
              lowercase.includes("not a robot") ||
              lowercase.includes("automated access to amazon data")
            ? "BLOCKED"
            : lowercase.includes('id="producttitle"') ||
                lowercase.includes('id="availability"') ||
                lowercase.includes('"@type":"product"')
              ? "PRODUCT_PAGE"
              : "UNEXPECTED_PAGE";

  if (classification !== "PRODUCT_PAGE") {
    return {
      classification,
      productName: null,
      priceCents: null,
      availability: "UNKNOWN",
      availabilityText: null,
      displayedRemainingQuantity: null,
      purchaseLimit: null,
      soldByAmazon: null,
      shipsFromAmazon: null,
    };
  }

  const productName = match(html, [
    /<span[^>]+id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i,
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
  ]);

  const availabilityText = match(html, [
    /<div[^>]+id=["']availability["'][^>]*>([\s\S]*?)<\/div>/i,
  ]);

  const priceText = match(html, [
    /<span[^>]+class=["'][^"']*a-offscreen[^"']*["'][^>]*>(\$[\d,.]+)<\/span>/i,
    /"price"\s*:\s*"([\d.]+)"/i,
  ]);

  const availabilityLowercase = (availabilityText ?? "").toLowerCase();

  let availability: Availability = "UNKNOWN";

  if (/only\s+\d+\s+left/.test(availabilityLowercase)) {
    availability = "LIMITED_STOCK";
  } else if (availabilityLowercase.includes("in stock")) {
    availability = "IN_STOCK";
  } else if (
    availabilityLowercase.includes("pre-order") ||
    availabilityLowercase.includes("preorder")
  ) {
    availability = "PREORDER";
  } else if (
    availabilityLowercase.includes("currently unavailable") ||
    availabilityLowercase.includes("temporarily out of stock")
  ) {
    availability = "UNAVAILABLE";
  } else if (availabilityLowercase.includes("out of stock")) {
    availability = "OUT_OF_STOCK";
  }

  const remainingMatch = /only\s+(\d+)\s+left/i.exec(
    availabilityText ?? "",
  );

  const limitMatch =
    /(?:limit|maximum)[^0-9]{0,20}(\d+)/i.exec(html) ??
    /"maxOrderQuantity"\s*:\s*(\d+)/i.exec(html);

  const merchant = match(html, [
    /<div[^>]+id=["']merchant-info["'][^>]*>([\s\S]*?)<\/div>/i,
  ]);

  return {
    classification,
    productName,
    priceCents: cents(priceText),
    availability,
    availabilityText,
    displayedRemainingQuantity: remainingMatch?.[1]
      ? Number.parseInt(remainingMatch[1], 10)
      : null,
    purchaseLimit: limitMatch?.[1]
      ? Number.parseInt(limitMatch[1], 10)
      : null,
    soldByAmazon:
      merchant === null
        ? null
        : /sold by\s+amazon(?:\.com)?/i.test(merchant),
    shipsFromAmazon:
      merchant === null
        ? null
        : /ships from\s+amazon(?:\.com)?/i.test(merchant),
  };
}

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
  asin: string,
  url: string,
): Promise<Monitor> {
  const id = `amazon-us:${asin}`;
  const timestamp = now();

  await env.DB.prepare(
    "INSERT OR IGNORE INTO monitors(id,retailer,external_id,canonical_url,enabled,mode,created_at,updated_at) VALUES(?,'amazon-us',?,?,1,'HEALTHY',?,?)",
  )
    .bind(id, asin, url, timestamp, timestamp)
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
    throw new Error(`Monitor unavailable for ${asin}`);
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
  job: Job,
  parsed: Parsed,
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
      "🚨 **AMAZON RESTOCK DETECTED**",
      `**${parsed.productName ?? `Amazon ASIN ${job.asin}`}**`,
      `Status: **${parsed.availability.replaceAll("_", " ")}**`,
      `Price: **${
        parsed.priceCents === null
          ? "Unknown"
          : `$${(parsed.priceCents / 100).toFixed(2)}`
      }**`,
      `Observed: **${observedAt}**`,
      `Amazon response: **${latency} ms**`,
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

  const started = performance.now();
  const observedAt = now();

  try {
    const response = await fetch(job.url, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
      },
    });

    const html = await response.text();
    const latency = Math.round(performance.now() - started);
    const parsed = parse(response.status, html);
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
      (previous?.sold_by_amazon !== bool(parsed.soldByAmazon) ||
        previous?.ships_from_amazon !== bool(parsed.shipsFromAmazon));

    const alertRequired =
      availabilityChanged &&
      ["IN_STOCK", "LIMITED_STOCK", "PREORDER"].includes(
        parsed.availability,
      );

    const workerColo = (
      response as Response & {
        cf?: {
          colo?: string;
        };
      }
    ).cf?.colo;

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
        ?,?,?,?,?,'amazon-us',?,?,?,?,'USD',?,?,?,?,?,?,?,?,?,?,?,?,?,
        'amazon-public-page-v0.1.0',?,?,?,?,?,?
      )`,
    )
      .bind(
        observationId,
        job.monitorId,
        job.id,
        observedAt,
        job.intendedAt,
        job.asin,
        job.url,
        parsed.productName,
        parsed.priceCents,
        parsed.availability,
        parsed.availabilityText,
        parsed.displayedRemainingQuantity,
        parsed.purchaseLimit,
        bool(parsed.soldByAmazon),
        bool(parsed.shipsFromAmazon),
        response.status,
        latency,
        new TextEncoder().encode(html).byteLength,
        parsed.classification,
        await hash(html),
        workerColo ? String(workerColo) : null,
        job.phaseOffsetSeconds,
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
      "amazon_response_latency",
      `Response classified as ${parsed.classification}.`,
      latency,
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
        job,
        parsed,
        observedAt,
        observationId,
        latency,
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

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
  ): Promise<void> {
    if (env.MONITOR_ENABLED.toLowerCase() !== "true") {
      return;
    }

    const scheduledDate = new Date(controller.scheduledTime);
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
      const asin = product.external_id.trim().toUpperCase();

      if (!/^[A-Z0-9]{10}$/.test(asin)) {
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
        `https://${env.AMAZON_MARKETPLACE}/dp/${asin}`;

      const currentMonitor = await monitor(env, asin, url);

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
    for (const message of batch.messages) {
      try {
        await run(env, message.body);
        message.ack();
      } catch (error) {
        console.error(error);
        message.retry({
          delaySeconds: 30,
        });
      }
    }
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const storefrontResponse = await handleStorefrontRequest(request, env);
    if (storefrontResponse) return storefrontResponse;

    if (url.pathname === "/health") {
      return Response.json({
        service: "crystal-intel-amazon-beta",
        status: "ok",
        now: now(),
      });
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

interface StorefrontEnv {
  DB: D1Database;
  SQUARE_ENVIRONMENT: "sandbox" | "production";
  SQUARE_APPLICATION_ID: string;
  SQUARE_LOCATION_ID: string;
  SQUARE_ACCESS_TOKEN?: string;
  SQUARE_WEBHOOK_SIGNATURE_KEY?: string;
  SQUARE_API_VERSION: string;
  SQUARE_WEBHOOK_URL?: string;
  STOREFRONT_ORIGIN: string;
  CHECKOUT_ENABLED?: string;
  ADMIN_TOKEN?: string;
  TAX_MODE?: "disabled" | "fixed";
  SALES_TAX_BASIS_POINTS?: string;
  ASSET_PUBLIC_BASE_URL?: string;
}

interface ListingRow {
  id: string;
  owner_id: string;
  ownership: "STORE_OWNED" | "CONSIGNMENT";
  sku: string;
  item_type: "SEALED" | "SINGLE" | "OTHER";
  product_name: string;
  quantity: number;
  price_cents: number;
  commission_basis_points: number;
  unit_weight_ounces: number | null;
  ships_separately: number;
}

const cors = (env: StorefrontEnv): HeadersInit => ({
  "access-control-allow-origin": env.STOREFRONT_ORIGIN,
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization",
  vary: "Origin",
});

const reply = (env: StorefrontEnv, body: unknown, status = 200): Response =>
  Response.json(body, { status, headers: cors(env) });

function customerShipping(subtotal: number, lines: Array<{ row: ListingRow; quantity: number }>, requested: string): number {
  const economyEligible = subtotal < 5000 && lines.every(({ row }) => row.item_type === "SINGLE" && !row.ships_separately);
  if (requested === "economy") {
    if (!economyEligible) throw new Error("Economy Letter is not available for this order.");
    return 199;
  }
  const base = subtotal >= 7500 ? 0 : 799;
  const separate = lines.reduce((sum, { row, quantity }) => sum + (row.ships_separately ? quantity : 0), 0);
  const regular = lines.some(({ row }) => !row.ships_separately);
  const packageCount = Math.max(1, separate + (regular ? 1 : 0));
  const firstWeight = lines.reduce((sum, { row, quantity }) => row.ships_separately ? sum : sum + (row.unit_weight_ounces ?? 0) * quantity, 0);
  return base + Math.max(0, packageCount - 1) * 500 + (firstWeight > 800 ? 500 : 0);
}

function taxQuote(env: StorefrontEnv, taxableCents: number): { taxCents: number; taxBasisPoints: number; configured: boolean } {
  if (env.TAX_MODE !== "fixed") return { taxCents: 0, taxBasisPoints: 0, configured: false };
  const taxBasisPoints = Number.parseInt(env.SALES_TAX_BASIS_POINTS ?? "", 10);
  if (!Number.isInteger(taxBasisPoints) || taxBasisPoints < 0 || taxBasisPoints > 2000) return { taxCents: 0, taxBasisPoints: 0, configured: false };
  return { taxCents: Math.round(taxableCents * taxBasisPoints / 10000), taxBasisPoints, configured: true };
}

function validAddress(address: unknown): address is { recipientName: string; line1: string; line2?: string; city: string; region: string; postalCode: string; countryCode: string; phone?: string } {
  if (!address || typeof address !== "object") return false;
  const value = address as Record<string, unknown>;
  return ["recipientName", "line1", "city", "region", "postalCode", "countryCode"].every((key) => typeof value[key] === "string" && String(value[key]).trim().length > 0);
}

async function checkoutLines(env: StorefrontEnv, items: Array<{ listingId?: string; quantity?: number }>): Promise<{ lines: Array<{ row: ListingRow; quantity: number }>; error?: string }> {
  if (!Array.isArray(items) || !items.length || items.length > 100) return { lines: [], error: "Invalid cart." };
  const quantities = new Map<string, number>();
  for (const item of items) {
    if (!item.listingId || !Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 99) return { lines: [], error: "Invalid cart quantity." };
    quantities.set(item.listingId, (quantities.get(item.listingId) ?? 0) + Number(item.quantity));
  }
  const lines: Array<{ row: ListingRow; quantity: number }> = [];
  for (const [id, quantity] of quantities) {
    const row = await env.DB.prepare("SELECT l.id,l.owner_id,l.ownership,l.sku,l.item_type,l.product_name,l.quantity,l.price_cents,l.unit_weight_ounces,l.ships_separately,o.commission_basis_points FROM inventory_listings l JOIN inventory_owners o ON o.id=l.owner_id WHERE l.id=? AND l.status='ACTIVE'").bind(id).first<ListingRow>();
    if (!row || row.price_cents === null || row.quantity < quantity) return { lines: [], error: "One or more items are no longer available." };
    lines.push({ row, quantity });
  }
  return { lines };
}

function authorizedAdmin(request: Request, env: StorefrontEnv): boolean {
  if (!env.ADMIN_TOKEN) return false;
  const authorization = request.headers.get("authorization") ?? "";
  return authorization === `Bearer ${env.ADMIN_TOKEN}`;
}

async function validSignature(env: StorefrontEnv, signature: string, raw: string): Promise<boolean> {
  if (!env.SQUARE_WEBHOOK_SIGNATURE_KEY || !env.SQUARE_WEBHOOK_URL || !signature) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.SQUARE_WEBHOOK_SIGNATURE_KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(env.SQUARE_WEBHOOK_URL + raw)));
  const expected = btoa(String.fromCharCode(...signed));
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  return mismatch === 0;
}

export async function handleStorefrontRequest(request: Request, env: StorefrontEnv): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/storefront/") && !url.pathname.startsWith("/api/admin/") && url.pathname !== "/api/payments/config") return null;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(env) });

  if (url.pathname === "/api/payments/config" && request.method === "GET") {
    return reply(env, { provider: "square", environment: env.SQUARE_ENVIRONMENT, applicationId: env.SQUARE_APPLICATION_ID, locationId: env.SQUARE_LOCATION_ID, configured: Boolean(env.SQUARE_ACCESS_TOKEN), checkoutEnabled: env.CHECKOUT_ENABLED === "true", taxConfigured: taxQuote(env, 0).configured });
  }

  if (url.pathname === "/api/storefront/listings" && request.method === "GET") {
    const game = url.searchParams.get("game");
    const setName = url.searchParams.get("set");
    const kind = url.searchParams.get("kind");
    const clauses = ["status='ACTIVE'", "quantity>0", "price_cents IS NOT NULL"];
    const bindings: unknown[] = [];
    if (game) { clauses.push("game_key=?"); bindings.push(game); }
    if (setName) { clauses.push("set_name=?"); bindings.push(setName); }
    if (kind === "sealed" || kind === "singles") { clauses.push("item_type=?"); bindings.push(kind === "sealed" ? "SEALED" : "SINGLE"); }
    const qualifiedClauses = clauses.map((clause) => `l.${clause}`);
    const result = await env.DB.prepare(`SELECT l.id,l.sku,l.item_type,l.product_name,l.set_name,l.set_code,l.collector_number,l.variant,l.card_condition,l.quantity,l.price_cents,l.ownership,CASE WHEN l.image_source='CATALOG' AND COALESCE(p.storefront_approved,0)=0 THEN NULL ELSE l.listing_image_url END AS listing_image_url,l.primary_asset_id FROM inventory_listings l LEFT JOIN storefront_catalog_products p ON p.provider=l.external_catalog_provider AND p.external_product_id=l.external_catalog_product_id WHERE ${qualifiedClauses.join(" AND ")} ORDER BY l.game_key,l.set_name,l.product_name LIMIT 500`).bind(...bindings).all();
    return reply(env, { listings: result.results });
  }

  if (url.pathname === "/api/storefront/quote" && request.method === "POST") {
    const body = await request.json() as { items?: Array<{ listingId?: string; quantity?: number }>; shippingService?: string; address?: unknown };
    if (!validAddress(body.address)) return reply(env, { error: "A complete shipping address is required." }, 400);
    const loaded = await checkoutLines(env, body.items ?? []);
    if (loaded.error) return reply(env, { error: loaded.error }, 409);
    const subtotalCents = loaded.lines.reduce((sum, { row, quantity }) => sum + row.price_cents * quantity, 0);
    let shippingCents: number;
    try { shippingCents = customerShipping(subtotalCents, loaded.lines, body.shippingService ?? "standard"); }
    catch (error) { return reply(env, { error: error instanceof Error ? error.message : "Invalid shipping option." }, 400); }
    const tax = taxQuote(env, subtotalCents);
    return reply(env, { subtotalCents, discountCents: 0, shippingCents, taxCents: tax.taxCents, taxBasisPoints: tax.taxBasisPoints, taxConfigured: tax.configured, totalCents: subtotalCents + shippingCents + tax.taxCents });
  }

  if (url.pathname === "/api/storefront/checkout" && request.method === "POST") {
    if (env.CHECKOUT_ENABLED !== "true") return reply(env, { error: "Online checkout is temporarily unavailable." }, 503);
    if (env.SQUARE_ENVIRONMENT !== "sandbox") return reply(env, { error: "Production checkout is not enabled." }, 503);
    if (!env.SQUARE_ACCESS_TOKEN) return reply(env, { error: "Square sandbox is not configured." }, 503);
    const body = await request.json() as { sourceId?: string; items?: Array<{ listingId?: string; quantity?: number }>; shippingService?: string; email?: string; address?: unknown };
    if (!body.sourceId || !Array.isArray(body.items) || !body.items.length || body.items.length > 100) return reply(env, { error: "Invalid checkout request." }, 400);
    if (!validAddress(body.address)) return reply(env, { error: "A complete shipping address is required." }, 400);
    const loaded = await checkoutLines(env, body.items);
    if (loaded.error) return reply(env, { error: loaded.error }, 409);
    const lines = loaded.lines;

    const subtotal = lines.reduce((sum, { row, quantity }) => sum + row.price_cents * quantity, 0);
    let shipping: number;
    try { shipping = customerShipping(subtotal, lines, body.shippingService ?? "standard"); }
    catch (error) { return reply(env, { error: error instanceof Error ? error.message : "Invalid shipping option." }, 400); }
    const taxResult = taxQuote(env, subtotal);
    const tax = taxResult.taxCents;
    const total = subtotal + shipping + tax;
    const saleId = crypto.randomUUID();
    const attemptId = crypto.randomUUID();
    const idempotencyKey = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const reserved: Array<{ row: ListingRow; quantity: number }> = [];

    for (const line of lines) {
      const result = await env.DB.prepare("UPDATE inventory_listings SET quantity=quantity-?,status=CASE WHEN quantity-?=0 THEN 'RESERVED' ELSE status END,updated_at=? WHERE id=? AND quantity>=?").bind(line.quantity, line.quantity, timestamp, line.row.id, line.quantity).run();
      if ((result.meta.changes ?? 0) !== 1) {
        for (const prior of reserved) await env.DB.prepare("UPDATE inventory_listings SET quantity=quantity+?,status='ACTIVE',updated_at=? WHERE id=?").bind(prior.quantity, timestamp, prior.row.id).run();
        return reply(env, { error: "Inventory changed while checking out. Please review your cart." }, 409);
      }
      reserved.push(line);
    }

    const inserts: D1PreparedStatement[] = [
      env.DB.prepare("INSERT INTO sales(id,sales_channel,status,subtotal_cents,tax_cents,shipping_cents,total_cents,created_at,payment_provider,payment_status,payment_updated_at,customer_email,recipient_name,shipping_line1,shipping_line2,shipping_city,shipping_region,shipping_postal_code,shipping_country_code,customer_phone,tax_basis_points) VALUES(?,'WEBSITE','PENDING',?,?,?,?,?,'square','PENDING',?,?,?,?,?,?,?,?,?,?,?,?)").bind(saleId, subtotal, tax, shipping, total, timestamp, timestamp, body.email ?? null, body.address.recipientName.trim(), body.address.line1.trim(), body.address.line2?.trim() || null, body.address.city.trim(), body.address.region.trim(), body.address.postalCode.trim(), body.address.countryCode.trim().toUpperCase(), body.address.phone?.trim() || null, taxResult.taxBasisPoints),
      env.DB.prepare("INSERT INTO payment_attempts(id,sale_id,provider,idempotency_key,amount_cents,currency,status,created_at,updated_at) VALUES(?,?,'square',?,?,'USD','PENDING',?,?)").bind(attemptId, saleId, idempotencyKey, total, timestamp, timestamp),
    ];
    for (const { row, quantity } of lines) {
      const gross = row.price_cents * quantity;
      const fee = Math.round(gross * row.commission_basis_points / 10000);
      inserts.push(env.DB.prepare("INSERT INTO sale_lines(id,sale_id,listing_id,owner_id,quantity,unit_price_cents,gross_cents,commission_basis_points,store_fee_cents,owner_proceeds_cents,ownership) VALUES(?,?,?,?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(), saleId, row.id, row.owner_id, quantity, row.price_cents, gross, row.commission_basis_points, fee, gross - fee, row.ownership));
      inserts.push(env.DB.prepare("INSERT INTO inventory_ledger(id,listing_id,event_type,quantity_delta,reference_type,reference_id,note,created_at) VALUES(?,?,'RESERVATION',?,'SALE',?,'Reserved for Square checkout',?)").bind(crypto.randomUUID(), row.id, -quantity, saleId, timestamp));
    }
    await env.DB.batch(inserts);

    const apiBase = "https://connect.squareupsandbox.com";
    const squareResponse = await fetch(`${apiBase}/v2/payments`, { method: "POST", headers: { authorization: `Bearer ${env.SQUARE_ACCESS_TOKEN}`, "content-type": "application/json", "square-version": env.SQUARE_API_VERSION }, body: JSON.stringify({ source_id: body.sourceId, idempotency_key: idempotencyKey, amount_money: { amount: total, currency: "USD" }, autocomplete: true, location_id: env.SQUARE_LOCATION_ID, reference_id: saleId, buyer_email_address: body.email || undefined, note: `Crystal Card Keep order ${saleId}` }) });
    const square = await squareResponse.json() as { payment?: { id: string; order_id?: string }; errors?: Array<{ code?: string; detail?: string }> };
    if (!squareResponse.ok || !square.payment) {
      for (const line of reserved) await env.DB.prepare("UPDATE inventory_listings SET quantity=quantity+?,status='ACTIVE',updated_at=? WHERE id=?").bind(line.quantity, timestamp, line.row.id).run();
      await env.DB.batch([
        env.DB.prepare("UPDATE sales SET status='CANCELLED',payment_status='FAILED',payment_updated_at=? WHERE id=?").bind(timestamp, saleId),
        env.DB.prepare("UPDATE payment_attempts SET status='FAILED',failure_code=?,failure_message=?,updated_at=? WHERE id=?").bind(square.errors?.[0]?.code ?? "SQUARE_ERROR", square.errors?.[0]?.detail ?? "Payment failed", timestamp, attemptId),
      ]);
      return reply(env, { error: square.errors?.[0]?.detail ?? "Square declined the payment." }, 402);
    }

    await env.DB.batch([
      env.DB.prepare("UPDATE sales SET external_order_id=?,status='PAID',paid_at=?,payment_status='PAID',square_payment_id=?,square_order_id=?,payment_updated_at=? WHERE id=?").bind(square.payment.order_id ?? square.payment.id, timestamp, square.payment.id, square.payment.order_id ?? null, timestamp, saleId),
      env.DB.prepare("UPDATE payment_attempts SET provider_payment_id=?,status='COMPLETED',updated_at=? WHERE id=?").bind(square.payment.id, timestamp, attemptId),
    ]);
    return reply(env, { orderId: saleId, status: "PAID", amountCents: total });
  }

  if (url.pathname === "/api/admin/catalog/products/import" && request.method === "POST") {
    if (!authorizedAdmin(request, env)) return reply(env, { error: "Unauthorized." }, 401);
    type GroupInput = { provider?: string; externalGroupId?: string; gameKey?: string; setCode?: string | null; setName?: string; releaseDate?: string | null; sourceModifiedAt?: string | null };
    type ProductInput = { provider?: string; externalProductId?: string; externalGroupId?: string; gameKey?: string; setCode?: string | null; setName?: string; productName?: string; cleanName?: string | null; itemType?: string; collectorNumber?: string | null; thumbnailUrl?: string | null; productUrl?: string | null; imageCount?: number; sourceModifiedAt?: string | null };
    const body = await request.json() as { gameKey?: string; groups?: GroupInput[]; products?: ProductInput[] };
    if (!body.gameKey || !Array.isArray(body.groups) || !Array.isArray(body.products) || body.groups.length > 600 || body.products.length > 500) return reply(env, { error: "Invalid catalog batch." }, 400);
    const timestamp = new Date().toISOString();
    const statements: D1PreparedStatement[] = [];
    for (const group of body.groups) {
      if (!group.provider || !group.externalGroupId || !group.setName || group.gameKey !== body.gameKey) continue;
      statements.push(env.DB.prepare("INSERT INTO storefront_catalog_groups(provider,external_group_id,game_key,set_code,set_name,release_date,source_modified_at,synced_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(provider,external_group_id) DO UPDATE SET game_key=excluded.game_key,set_code=excluded.set_code,set_name=excluded.set_name,release_date=excluded.release_date,source_modified_at=excluded.source_modified_at,synced_at=excluded.synced_at").bind(group.provider, group.externalGroupId, group.gameKey, group.setCode ?? null, group.setName, group.releaseDate ?? null, group.sourceModifiedAt ?? null, timestamp));
    }
    for (const product of body.products) {
      if (!product.provider || !product.externalProductId || !product.externalGroupId || !product.setName || !product.productName || product.gameKey !== body.gameKey || !["SEALED", "SINGLE", "OTHER"].includes(product.itemType ?? "")) continue;
      statements.push(env.DB.prepare("INSERT INTO storefront_catalog_products(provider,external_product_id,external_group_id,game_key,set_code,set_name,product_name,clean_name,item_type,collector_number,thumbnail_url,product_url,image_count,source_modified_at,synced_at,media_source_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(provider,external_product_id) DO UPDATE SET external_group_id=excluded.external_group_id,game_key=excluded.game_key,set_code=excluded.set_code,set_name=excluded.set_name,product_name=excluded.product_name,clean_name=excluded.clean_name,item_type=excluded.item_type,collector_number=excluded.collector_number,thumbnail_url=excluded.thumbnail_url,product_url=excluded.product_url,image_count=excluded.image_count,source_modified_at=excluded.source_modified_at,synced_at=excluded.synced_at,media_source_id=excluded.media_source_id").bind(product.provider, product.externalProductId, product.externalGroupId, product.gameKey, product.setCode ?? null, product.setName, product.productName, product.cleanName ?? null, product.itemType, product.collectorNumber ?? null, product.thumbnailUrl ?? null, product.productUrl ?? null, Number(product.imageCount ?? 0), product.sourceModifiedAt ?? null, timestamp, product.provider));
    }
    for (let index = 0; index < statements.length; index += 75) await env.DB.batch(statements.slice(index, index + 75));
    await env.DB.prepare("UPDATE inventory_listings AS l SET listing_image_url=(SELECT p.thumbnail_url FROM storefront_catalog_products p WHERE p.game_key=l.game_key AND lower(p.set_name)=lower(l.set_name) AND lower(p.product_name)=lower(l.product_name) AND p.thumbnail_url IS NOT NULL LIMIT 1),image_source='CATALOG',external_catalog_provider=(SELECT p.provider FROM storefront_catalog_products p WHERE p.game_key=l.game_key AND lower(p.set_name)=lower(l.set_name) AND lower(p.product_name)=lower(l.product_name) LIMIT 1),external_catalog_product_id=(SELECT p.external_product_id FROM storefront_catalog_products p WHERE p.game_key=l.game_key AND lower(p.set_name)=lower(l.set_name) AND lower(p.product_name)=lower(l.product_name) LIMIT 1),updated_at=? WHERE l.game_key=? AND l.listing_image_url IS NULL AND EXISTS(SELECT 1 FROM storefront_catalog_products p WHERE p.game_key=l.game_key AND lower(p.set_name)=lower(l.set_name) AND lower(p.product_name)=lower(l.product_name) AND p.thumbnail_url IS NOT NULL)").bind(timestamp, body.gameKey).run();
    return reply(env, { importedGroups: body.groups.length, importedProducts: body.products.length, gameKey: body.gameKey });
  }

  if (url.pathname === "/api/admin/catalog/sources" && request.method === "GET") {
    if (!authorizedAdmin(request, env)) return reply(env, { error: "Unauthorized." }, 401);
    const result = await env.DB.prepare("SELECT id,display_name,provider_url,rights_status,approved_scope,documentation_url,requested_at,approved_at,expires_at,confirmed_by,notes,updated_at FROM catalog_media_sources ORDER BY display_name").all();
    return reply(env, { sources: result.results });
  }

  if (url.pathname === "/api/admin/catalog/sources" && request.method === "POST") {
    if (!authorizedAdmin(request, env)) return reply(env, { error: "Unauthorized." }, 401);
    const body = await request.json() as { id?: string; displayName?: string; providerUrl?: string; notes?: string };
    const id = String(body.id ?? "").trim().toLowerCase();
    const displayName = String(body.displayName ?? "").trim();
    if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(id) || !displayName) return reply(env, { error: "A valid source ID and display name are required." }, 400);
    const timestamp = new Date().toISOString();
    await env.DB.prepare("INSERT INTO catalog_media_sources(id,display_name,provider_url,rights_status,notes,created_at,updated_at) VALUES(?,?,?,'REQUESTED',?,?,?) ON CONFLICT(id) DO UPDATE SET display_name=excluded.display_name,provider_url=excluded.provider_url,rights_status=CASE WHEN catalog_media_sources.rights_status='APPROVED' THEN 'APPROVED' ELSE 'REQUESTED' END,notes=excluded.notes,requested_at=?,updated_at=excluded.updated_at").bind(id, displayName, body.providerUrl ?? null, body.notes ?? null, timestamp, timestamp, timestamp).run();
    return reply(env, { id, rightsStatus: "REQUESTED" });
  }

  if (url.pathname === "/api/admin/catalog/sources/approve" && request.method === "POST") {
    if (!authorizedAdmin(request, env)) return reply(env, { error: "Unauthorized." }, 401);
    const body = await request.json() as { id?: string; approvedScope?: string; documentationUrl?: string; confirmedBy?: string; expiresAt?: string | null };
    const id = String(body.id ?? "").trim();
    const scope = String(body.approvedScope ?? "").trim();
    const documentationUrl = String(body.documentationUrl ?? "").trim();
    const confirmedBy = String(body.confirmedBy ?? "").trim();
    if (!id || !scope || !confirmedBy || !/^https:\/\//.test(documentationUrl)) return reply(env, { error: "Source, scope, approver, and an HTTPS permission record are required." }, 400);
    const timestamp = new Date().toISOString();
    const result = await env.DB.prepare("UPDATE catalog_media_sources SET rights_status='APPROVED',approved_scope=?,documentation_url=?,approved_at=?,expires_at=?,confirmed_by=?,updated_at=? WHERE id=?").bind(scope, documentationUrl, timestamp, body.expiresAt ?? null, confirmedBy, timestamp, id).run();
    if ((result.meta.changes ?? 0) !== 1) return reply(env, { error: "Media source was not found." }, 404);
    await env.DB.prepare("UPDATE storefront_catalog_products SET storefront_approved=1 WHERE media_source_id=?").bind(id).run();
    return reply(env, { id, rightsStatus: "APPROVED", approvedAt: timestamp });
  }

  if (url.pathname === "/api/admin/inventory/import" && request.method === "POST") {
    if (!authorizedAdmin(request, env)) return reply(env, { error: "Unauthorized." }, 401);
    const body = await request.json() as { ownerId?: string; filename?: string; sourceKind?: string; rows?: Array<Record<string, unknown>> };
    if (!body.ownerId || !Array.isArray(body.rows) || !body.rows.length || body.rows.length > 1000) return reply(env, { error: "Owner and 1-1000 inventory rows are required." }, 400);
    const owner = await env.DB.prepare("SELECT id,owner_type FROM inventory_owners WHERE id=? AND status='ACTIVE'").bind(body.ownerId).first<{ id: string; owner_type: string }>();
    if (!owner) return reply(env, { error: "Inventory owner was not found." }, 404);
    const batchId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const sourceKind = ["CSV", "XLSX", "XLS"].includes(String(body.sourceKind ?? "").toUpperCase()) ? String(body.sourceKind).toUpperCase() : "CSV";
    const statements: D1PreparedStatement[] = [env.DB.prepare("INSERT INTO inventory_import_batches(id,owner_id,source_kind,original_filename,status,total_rows,accepted_rows,rejected_rows,created_at) VALUES(?,?,?,?, 'NEEDS_REVIEW',?,0,0,?)").bind(batchId, owner.id, sourceKind, body.filename ?? "inventory.csv", body.rows.length, timestamp)];
    let accepted = 0;
    let rejected = 0;
    const errors: Array<{ row: number; error: string }> = [];
    body.rows.forEach((raw, index) => {
      const productName = String(raw.product_name ?? raw.name ?? "").trim();
      const sku = String(raw.sku ?? "").trim();
      const gameKey = String(raw.game_key ?? raw.game ?? "").trim().toLowerCase();
      const itemType = String(raw.item_type ?? raw.type ?? "").trim().toUpperCase();
      const quantity = Number(raw.quantity ?? raw.qty ?? 0);
      const price = raw.price_cents !== undefined && raw.price_cents !== "" ? Number(raw.price_cents) : Math.round(Number(raw.price ?? 0) * 100);
      if (!productName || !sku || !gameKey || !["SEALED", "SINGLE", "OTHER"].includes(itemType) || !Number.isInteger(quantity) || quantity < 0 || !Number.isInteger(price) || price < 0) {
        rejected += 1;
        errors.push({ row: index + 2, error: "Missing/invalid name, SKU, game, item type, quantity, or price." });
        return;
      }
      accepted += 1;
      const suppliedImage = String(raw.image_url ?? "").trim();
      statements.push(env.DB.prepare("INSERT INTO inventory_listings(id,owner_id,import_batch_id,ownership,game_key,sku,item_type,product_name,set_code,set_name,collector_number,variant,card_condition,language,quantity,price_cents,status,notes,listing_image_url,image_source,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'DRAFT',?,?,?,?,?) ON CONFLICT(sku) DO UPDATE SET quantity=excluded.quantity,price_cents=excluded.price_cents,notes=excluded.notes,listing_image_url=CASE WHEN excluded.listing_image_url IS NOT NULL THEN excluded.listing_image_url ELSE inventory_listings.listing_image_url END,image_source=CASE WHEN excluded.listing_image_url IS NOT NULL THEN 'MANUAL' ELSE inventory_listings.image_source END,updated_at=excluded.updated_at").bind(crypto.randomUUID(), owner.id, batchId, owner.owner_type === "STORE" ? "STORE_OWNED" : "CONSIGNMENT", gameKey, sku, itemType, productName, raw.set_code ?? null, raw.set_name ?? null, raw.collector_number ?? null, raw.variant ?? null, raw.card_condition ?? raw.condition ?? null, raw.language ?? "English", quantity, price, raw.notes ?? null, suppliedImage || null, suppliedImage ? "MANUAL" : "NONE", timestamp, timestamp));
    });
    statements.push(env.DB.prepare("UPDATE inventory_import_batches SET accepted_rows=?,rejected_rows=? WHERE id=?").bind(accepted, rejected, batchId));
    await env.DB.batch(statements);
    await env.DB.prepare("UPDATE inventory_listings AS l SET listing_image_url=COALESCE(l.listing_image_url,(SELECT p.thumbnail_url FROM storefront_catalog_products p WHERE p.game_key=l.game_key AND (lower(p.set_name)=lower(l.set_name) OR lower(p.set_code)=lower(l.set_code)) AND lower(p.product_name)=lower(l.product_name) AND p.thumbnail_url IS NOT NULL LIMIT 1)),image_source=CASE WHEN l.listing_image_url IS NULL AND EXISTS(SELECT 1 FROM storefront_catalog_products p WHERE p.game_key=l.game_key AND (lower(p.set_name)=lower(l.set_name) OR lower(p.set_code)=lower(l.set_code)) AND lower(p.product_name)=lower(l.product_name) AND p.thumbnail_url IS NOT NULL) THEN 'CATALOG' ELSE l.image_source END,external_catalog_provider=(SELECT p.provider FROM storefront_catalog_products p WHERE p.game_key=l.game_key AND (lower(p.set_name)=lower(l.set_name) OR lower(p.set_code)=lower(l.set_code)) AND lower(p.product_name)=lower(l.product_name) LIMIT 1),external_catalog_product_id=(SELECT p.external_product_id FROM storefront_catalog_products p WHERE p.game_key=l.game_key AND (lower(p.set_name)=lower(l.set_name) OR lower(p.set_code)=lower(l.set_code)) AND lower(p.product_name)=lower(l.product_name) LIMIT 1),updated_at=? WHERE l.import_batch_id=?").bind(timestamp, batchId).run();
    return reply(env, { batchId, status: "NEEDS_REVIEW", totalRows: body.rows.length, acceptedRows: accepted, rejectedRows: rejected, errors });
  }

  if (url.pathname === "/api/admin/inventory/listings" && request.method === "GET") {
    if (!authorizedAdmin(request, env)) return reply(env, { error: "Unauthorized." }, 401);
    const batchId = String(url.searchParams.get("batchId") ?? "").trim();
    if (!batchId) return reply(env, { error: "Batch ID is required." }, 400);
    const batch = await env.DB.prepare("SELECT b.id,b.owner_id,b.source_kind,b.original_filename,b.status,b.total_rows,b.accepted_rows,b.rejected_rows,b.created_at,o.display_name,o.owner_type FROM inventory_import_batches b JOIN inventory_owners o ON o.id=b.owner_id WHERE b.id=?").bind(batchId).first();
    if (!batch) return reply(env, { error: "Inventory batch was not found." }, 404);
    const listings = await env.DB.prepare("SELECT id,sku,game_key,item_type,product_name,set_code,set_name,collector_number,variant,card_condition,language,quantity,price_cents,status,ownership,notes,listing_image_url FROM inventory_listings WHERE import_batch_id=? ORDER BY game_key,set_name,product_name,sku").bind(batchId).all();
    return reply(env, { batch, listings: listings.results });
  }

  if (url.pathname === "/api/admin/inventory/publish" && request.method === "POST") {
    if (!authorizedAdmin(request, env)) return reply(env, { error: "Unauthorized." }, 401);
    const body = await request.json() as { listingIds?: string[] };
    if (!Array.isArray(body.listingIds) || !body.listingIds.length || body.listingIds.length > 500) return reply(env, { error: "Listing IDs are required." }, 400);
    const timestamp = new Date().toISOString();
    const results = await env.DB.batch(body.listingIds.map((id) => env.DB.prepare("UPDATE inventory_listings SET status=CASE WHEN quantity>0 AND price_cents IS NOT NULL THEN 'ACTIVE' ELSE 'DRAFT' END,updated_at=? WHERE id=?").bind(timestamp, id)));
    const updated = results.reduce((sum, result) => sum + Number(result.meta.changes ?? 0), 0);
    await env.DB.prepare("UPDATE inventory_import_batches SET status='IMPORTED',approved_at=COALESCE(approved_at,?),imported_at=? WHERE id IN (SELECT DISTINCT import_batch_id FROM inventory_listings WHERE id IN (" + body.listingIds.map(() => "?").join(",") + "))").bind(timestamp, timestamp, ...body.listingIds).run();
    return reply(env, { updated });
  }

  if (url.pathname === "/api/admin/orders" && request.method === "GET") {
    if (!authorizedAdmin(request, env)) return reply(env, { error: "Unauthorized." }, 401);
    const result = await env.DB.prepare("SELECT id,status,subtotal_cents,discount_cents,tax_cents,shipping_cents,total_cents,customer_email,recipient_name,shipping_line1,shipping_line2,shipping_city,shipping_region,shipping_postal_code,shipping_country_code,customer_phone,external_order_id,square_payment_id,created_at,paid_at FROM sales ORDER BY created_at DESC LIMIT 200").all();
    return reply(env, { orders: result.results });
  }

  if (url.pathname === "/api/admin/orders/fulfill" && request.method === "POST") {
    if (!authorizedAdmin(request, env)) return reply(env, { error: "Unauthorized." }, 401);
    const body = await request.json() as { saleId?: string; carrier?: string; trackingNumber?: string };
    if (!body.saleId || !body.carrier || !body.trackingNumber) return reply(env, { error: "Sale, carrier, and tracking number are required." }, 400);
    const sale = await env.DB.prepare("SELECT id,status,shipping_cents FROM sales WHERE id=?").bind(body.saleId).first<{ id: string; status: string; shipping_cents: number }>();
    if (!sale || sale.status !== "PAID") return reply(env, { error: "Only a paid order can be marked fulfilled." }, 409);
    const timestamp = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO shipments(id,sale_id,provider,carrier,tracking_number,customer_shipping_cents,status,package_json,shipped_at,created_at,updated_at) VALUES(?,?,'MANUAL',?,?,?,'IN_TRANSIT','{}',?,?,?)").bind(crypto.randomUUID(), sale.id, body.carrier.trim(), body.trackingNumber.trim(), sale.shipping_cents, timestamp, timestamp, timestamp),
      env.DB.prepare("UPDATE sales SET status='FULFILLED' WHERE id=? AND status='PAID'").bind(sale.id),
    ]);
    return reply(env, { saleId: sale.id, status: "FULFILLED" });
  }

  if (url.pathname === "/api/storefront/webhooks/square" && request.method === "POST") {
    const raw = await request.text();
    if (!(await validSignature(env, request.headers.get("x-square-hmacsha256-signature") ?? "", raw))) return reply(env, { error: "Invalid signature." }, 403);
    const event = JSON.parse(raw) as { event_id?: string; type?: string; data?: { object?: { payment?: { id?: string; status?: string } } } };
    if (!event.event_id || !event.type) return reply(env, { error: "Invalid event." }, 400);
    const inserted = await env.DB.prepare("INSERT OR IGNORE INTO payment_webhook_events(provider,provider_event_id,event_type,signature_verified,payload_json,received_at) VALUES('square',?,?,1,?,?)").bind(event.event_id, event.type, raw, new Date().toISOString()).run();
    if ((inserted.meta.changes ?? 0) === 0) return reply(env, { received: true, duplicate: true });
    const payment = event.data?.object?.payment;
    if (payment?.id && payment.status) {
      const status = payment.status === "COMPLETED" ? "PAID" : ["FAILED", "CANCELED"].includes(payment.status) ? "FAILED" : "PENDING";
      await env.DB.prepare("UPDATE sales SET payment_status=?,payment_updated_at=? WHERE square_payment_id=?").bind(status, new Date().toISOString(), payment.id).run();
    }
    await env.DB.prepare("UPDATE payment_webhook_events SET processed_at=? WHERE provider='square' AND provider_event_id=?").bind(new Date().toISOString(), event.event_id).run();
    return reply(env, { received: true });
  }

  return reply(env, { error: "Not found" }, 404);
}

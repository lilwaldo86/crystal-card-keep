# Inventory and consignment MVP

## Launch scope

The first intake screen is private and administrator-only at `/admin/inventory/import`.
It is not linked from public navigation. Public customer uploads are a later marketplace phase.

Each intake begins by selecting either The Crystal Card Keep or a saved consignor. The import accepts CSV, XLSX, XLS, PDF, or manual entry. CSV and Excel rows may be mapped automatically. PDF extraction always enters `NEEDS_REVIEW` because layout-based extraction is not reliably deterministic.

No uploaded row becomes purchasable immediately. The workflow is:

1. Upload and retain the original file privately.
2. Parse rows into an import preview.
3. Match game, set, card, sealed product, condition, and variant against the canonical catalog.
4. Resolve rejected or ambiguous rows.
5. Approve the batch.
6. Create draft listings.
7. Set price and quantity, then publish.

### Implemented first slice

- The private route and administrator-token gate are present.
- CSV parsing and an eight-row browser preview are present.
- Valid rows create or update draft listings through `/api/admin/inventory/import`.
- Imported batches remain `NEEDS_REVIEW`.
- `/api/admin/inventory/publish` can activate reviewed, priced listings with positive quantity.
- Excel and PDF selection is recognized but intentionally not parsed yet; those formats remain deferred to a review-safe server-side parser.

## Ownership and storefront designation

Every listing has immutable ownership provenance: `STORE_OWNED` or `CONSIGNMENT`, plus an `owner_id`. A consignment listing should show a small `Consignment` designation on the public product page. The consignor's private name, email, phone, commission, and payout details must never be exposed publicly.

## Sales and payouts

At checkout, each sale line snapshots its owner, ownership type, commission rate, store fee, and owner proceeds. This ensures later changes to a consignor's default rate cannot rewrite past accounting. Paid consignment sale lines can be grouped into payout statements without mixing store-owned inventory.

## Supported import columns

Preferred columns are: game, item type, set code, set name, card/product name, collector number, variant, condition, language, quantity, price, minimum price, SKU, and notes. Owner and commission are selected for the batch rather than repeated in every row.

Shipping-ready imports should also accept unit weight in ounces, outer package length, width and height in inches, and whether an item must ship separately. Missing measurements keep a listing in draft until a package preset or manual measurement is assigned.

## Dynamic shipping

The customer-facing launch policy is $1.99 Economy Letter for eligible singles-only orders under $50, $7.99 standard tracked shipping below $75, and free standard tracked shipping at $75 or more. Free shipping covers the first standard package. Each additional package costs $5, and a first package over 50 lb costs $5. An additional package that is also over 50 lb is charged only once. Freight or exceptional oversized products use a separately disclosed rule. All charges must be calculated and displayed before payment.

Packing still uses each listing's packaged weight, dimensions, package compatibility, and `ships_separately` designation. This lets the checkout determine package count automatically while keeping the customer's surcharge predictable rather than passing through every carrier cost.

Pirate Ship may be used for manual label purchase and spreadsheet order import, but it has no API and therefore cannot provide live checkout quotes. During the manual launch phase, orders that lack a live carrier quote must remain pending until shipping is quoted and accepted. Once UPS credentials are available, the UPS Rating API becomes a quote provider and the UPS Shipping API can create labels. The database remains provider-neutral so another carrier or aggregator can be added later.

## Scale path

The same import pipeline can later back consignor accounts. A consignor upload must remain a draft until administrator approval. Role-based access must ensure consignors can see only their own inventory, sales, and payouts. File storage should use private object storage with short-lived signed access, while normalized inventory remains in D1.

Product and card media use `catalog_assets`. Original and thumbnail objects should live in controlled R2 storage, with only public delivery URLs exposed to the storefront. A listing may override its catalog image for condition-sensitive singles or consignment photos.

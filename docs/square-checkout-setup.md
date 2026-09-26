# Square checkout setup

The site uses Square sandbox credentials until checkout, inventory reservation, webhook verification, refunds, and shipping totals pass end-to-end tests.

Public configuration lives in `services/crystal-intel/wrangler.jsonc`: the environment, Application ID, and Location ID. The Square Access Token and webhook signature key must never be committed. Store them as Cloudflare Worker secrets named `SQUARE_ACCESS_TOKEN` and `SQUARE_WEBHOOK_SIGNATURE_KEY`.

The public `GET /api/payments/config` endpoint returns only browser-safe Square configuration and whether the server-side token is configured. It never returns the token.

Migration `0005_square_payments.sql` adds provider-neutral payment attempts, idempotency keys, Square references on sales, and deduplicated webhook-event storage. Checkout must calculate all prices, shipping, ownership, and inventory availability on the server before creating a payment.

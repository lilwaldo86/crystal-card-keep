# Crystal Card Keep Development Log

## Sprint 0 — Repository Baseline and Stabilization

Date: 2026-07-26  
Branch: `sprint-0-baseline`

### Current stack

- React 18
- React Router 6
- Vite 5
- Cloudflare Pages
- Cloudflare Pages Functions
- Cloudflare Turnstile
- JavaScript and JSX
- Git and GitHub

### Current structure

- `src/App.jsx` — active routing, header, and landing page
- `src/pages/` — storefront and informational page components
- `src/components/` — reusable and legacy UI components
- `src/data/` — inventory, preorder, and shop catalog data
- `functions/api/contact.js` — contact-form API
- `public/` — static assets and Cloudflare redirect configuration
- `wrangler.toml` — Cloudflare configuration

### Confirmed working baseline

- Production build completes successfully with Vite.
- Landing page is routed at `/`.
- Shop page is routed at `/shop`.
- Contact page and Turnstile integration are routed at `/contact`.
- Affiliates page is routed at `/affiliates`.
- Static shop catalog data is present.
- Cloudflare SPA redirect configuration is present.
- Existing local backup files are preserved and ignored by Git.

### Known technical debt

- Several page files exist but are not connected to active routes.
- Header links for Sell, Trade, and Live do not have matching routes in `App.jsx`.
- Site search currently prevents submission and has no search implementation.
- Shop set selections currently log to the console instead of opening products.
- Cart, checkout, accounts, purchasing limits, and marketplace functions are not implemented.
- Inventory and catalog content are stored as local JavaScript data.
- No automated test, lint, or type-check scripts are configured.
- The codebase currently uses JavaScript/JSX rather than TypeScript.
- Contact delivery depends on Cloudflare runtime configuration and secrets that are not verified by a local Vite build.
- Legacy and currently unused pages/components should be reviewed before removal or reconnection.
- Text encoding should be verified separately before modifying displayed punctuation or accented names.

### Immediate TODO

1. Preserve the current uncommitted storefront work in the approved baseline commit.
2. Perform a browser smoke test of all four active routes.
3. Verify contact-form delivery in the deployed Cloudflare environment.
4. Have Prime define Sprint 1 scope and decide which disconnected routes should be restored.
5. Keep Crystal Intel architecture and feature work outside Sprint 0.

### Sprint 0 build result

`npm run build` passed before this log was created.

## Sprint 1 â€” Navigation and Route Stabilization

Date: 2026-07-26
Branch: `sprint-1-route-stabilization`
Starting commit: `4b838c26cab62f830e5d3a247008947070393ca3`

### Route inventory and decisions

- `/` â€” Home; retained.
- `/shop` â€” Shop; retained.
- `/contact` â€” Contact; retained.
- `/affiliates` â€” Affiliates; retained.
- `/live` â€” restored using the existing compatible `Live.jsx` page.
- `/sell` â€” deferred because no existing Sell page is present; misleading links removed.
- `/trade` â€” deferred because no existing Trade page is present; misleading links removed.
- `*` â€” branded not-found fallback added.

### Navigation changes

- Internal navigation now uses React Router links.
- Desktop and mobile navigation expose only intentional registered destinations.
- Home call-to-action links to missing Sell and Trade pages were removed.
- Search remains visible and nonfunctional; implementation and redesign remain deferred for Prime review.

### Direct loading

- Existing `public/_redirects` SPA fallback supports direct URL loading and refresh on Cloudflare Pages.

### Verification

- Production build is run by the Sprint 1 installer.
- Desktop Home, Shop, Live, Contact, and Affiliates navigation passed browser verification.
- Mobile navigation was checked but does not scroll horizontally as expected, and the full hero does not fit correctly.
- Christopher deferred all mobile corrections until the desktop site is otherwise ready.
- The animated Crystal Card Keep logo card has clipped/incomplete borders; visual repair is deferred for one consolidated desktop/mobile correction.

## Sprint 2 â€” Desktop Interaction Audit and Stabilization

Date: 2026-07-26
Branch: `sprint-2-desktop-interactions`
Starting commit: `27e5ad02c2efcb37469b826dc89230d9f3cf5463`

### Approved interaction repairs

- Home search now routes to `/shop?q=...`.
- Search filters only the active Shop page's local static `DATA`.
- Matching and no-results messages are provided.
- The search icon is an accessible submit button.
- Nonfunctional Shop set anchors are now noninteractive display elements.
- Affiliate destinations open in new tabs with safe relationship attributes.

### Explicit deferrals

- `shopCatalog.js` remains disconnected pending a separate controlled migration.
- Live remains unchanged pending confirmation of the official Whatnot URL.
- Contact, product data, commerce behavior, mobile code, and animated-card styling were not intentionally changed.

### Verification

- Production build is run by the Sprint 2 Phase B installer.
- Desktop browser verification is required before commit approval.

### Phase B verification repair

- Corrected Windows PowerShell source-encoding corruption in the modified JSX files.
- Removed controlled Home search state so typing retains keyboard focus.
- Search now treats punctuation and spacing as aliases; for example, OP14, OP-14, and OP 14 are equivalent.
- Fuzzy matching remains deferred to avoid unrelated results.

### Approved bounded game-route extension

- Added canonical routes `/shop/pokemon`, `/shop/one-piece`, and `/shop/mtg`.
- All three routes reuse the existing Shop component and active static `DATA`.
- Each game route selects and displays only that game's current sets.
- Home game bubbles now link to their canonical routes.
- Desktop game bubbles are aligned in one row directly below the Home search bar.
- `/shop` remains the general Shop destination.
- Query search remains compatible with game-specific routes.
- No mobile-specific rule, duplicate page component, or `shopCatalog.js` integration was added.

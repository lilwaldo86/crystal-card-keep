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

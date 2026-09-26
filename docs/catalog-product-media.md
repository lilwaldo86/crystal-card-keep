# Product thumbnail catalog

`npm run sync:media` builds a normalized product and thumbnail index for Pokémon, Magic, One Piece, Dragon Ball Super: Fusion World, Dragon Ball Super: Masters, and Gundam. The source job runs server-side, obeys the upstream daily-update guidance, waits between requests, and never makes catalog requests from a shopper's browser.

Each record keeps its provider ID, set, product name, item type, source product URL, thumbnail URL, modification time, and sync time. Inventory imports automatically attach an exact set-and-product match while preserving a manually supplied `image_url` as the highest-priority image.

## Automatic daily operation

The existing `Catalog sync` GitHub workflow runs daily. Product media upload turns on after these repository secrets are configured:

- `CATALOG_SYNC_ENDPOINT`: the Worker base URL
- `CATALOG_ADMIN_TOKEN`: the same secret configured as the Worker's `ADMIN_TOKEN`

The job uploads to `/api/admin/catalog/products/import` in small authenticated batches. It does not publish inventory or create products for sale. New catalog products become available for matching, while only inventory with positive quantity, a price, and `ACTIVE` status appears in the shop.

## Image rights safeguard

The initial multi-game metadata source is TCGCSV's cached TCGplayer catalog. The snapshot stores attribution and source URLs, but the production storefront must not treat the images as owned assets. Confirm the applicable upstream terms before enabling these images publicly or copying them into R2. Seller-supplied listing photographs and explicitly licensed publisher assets can safely override catalog thumbnails.

The legacy Pokémon TCG API is scheduled to stop serving existing keys after March 1, 2027, so it must not be the sole long-term Pokémon image source. Magic card images can also be sourced through Scryfall bulk data under Scryfall's published API/image guidance.

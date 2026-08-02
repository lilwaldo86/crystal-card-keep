import {
  matchFirst,
  parsePriceCents,
  stripMarkup,
} from "../normalization.ts";
import type {
  NormalizedRetailerPayload,
  RetailerAdapter,
  RetailerAvailability,
  RetailerDiscoveryItem,
  RetailerDiscoveryRequest,
  RetailerFetchResult,
  RetailerResponseClassification,
} from "../types";

const emptyPayload = (
  classification: RetailerResponseClassification,
): NormalizedRetailerPayload => ({
  classification,
  productName: null,
  priceCents: null,
  currency: "USD",
  availability: "UNKNOWN",
  availabilityText: null,
  displayedRemainingQuantity: null,
  purchaseLimit: null,
  soldByRetailer: null,
  shipsFromRetailer: null,
});

export class AmazonAdapter implements RetailerAdapter {
  readonly retailerId = "amazon-us";
  readonly displayName = "Amazon";
  readonly scraperVersion = "amazon-public-page-v0.1.0";
  readonly responseLatencyNoteCategory = "amazon_response_latency";

  normalizeExternalId(value: string): string {
    return value.trim().toUpperCase();
  }

  isValidExternalId(value: string): boolean {
    return /^[A-Z0-9]{10}$/.test(value);
  }

  canonicalUrl(externalId: string, marketplace: string): string {
    return `https://${marketplace}/dp/${externalId}`;
  }

  async fetchListing(url: string): Promise<RetailerFetchResult> {
    const started = performance.now();
    const response = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
      },
    });
    const body = await response.text();

    return {
      status: response.status,
      body,
      latencyMs: Math.round(performance.now() - started),
      responseSizeBytes: new TextEncoder().encode(body).byteLength,
      workerColo:
        (
          response as Response & {
            cf?: {
              colo?: string;
            };
          }
        ).cf?.colo ?? null,
    };
  }

  async discover(
    request: RetailerDiscoveryRequest,
  ): Promise<RetailerDiscoveryItem[]> {
    const fetched = await this.fetchListing(request.sourceUrl);

    if (fetched.status >= 400) {
      throw new Error(
        `Amazon discovery request failed with status ${fetched.status}`,
      );
    }

    const marketplace = new URL(request.sourceUrl).host;
    const discovered = new Map<string, RetailerDiscoveryItem>();
    const itemPattern =
      /data-asin=["']([A-Z0-9]{10})["']/gi;
    const itemMatches = [...fetched.body.matchAll(itemPattern)];

    for (let index = 0; index < itemMatches.length; index += 1) {
      const match = itemMatches[index];

      if (!match) {
        continue;
      }

      const externalId = this.normalizeExternalId(match[1] ?? "");

      if (!this.isValidExternalId(externalId)) {
        continue;
      }

      const start = match.index ?? 0;
      const nextStart = itemMatches[index + 1]?.index;
      const end = Math.min(nextStart ?? start + 4000, start + 4000);
      const segment = fetched.body.slice(start, end);
      const title = matchFirst(segment, [
        /<h2[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i,
        /aria-label=["']([^"']+)["']/i,
      ]);
      const priceText = matchFirst(segment, [
        /<span[^>]+class=["'][^"']*a-offscreen[^"']*["'][^>]*>(\$[\d,.]+)<\/span>/i,
      ]);

      discovered.set(externalId, {
        externalId,
        canonicalUrl: this.canonicalUrl(externalId, marketplace),
        title: title ? stripMarkup(title) : null,
        priceCents: parsePriceCents(priceText),
        currency: "USD",
        availability: "UNKNOWN",
        identifiers: [
          {
            identifierType: "ASIN",
            value: externalId,
          },
        ],
      });
    }

    const linkPattern = /\/dp\/([A-Z0-9]{10})(?:[/?#"' ]|$)/gi;

    for (const match of fetched.body.matchAll(linkPattern)) {
      const externalId = this.normalizeExternalId(match[1] ?? "");

      if (
        !this.isValidExternalId(externalId) ||
        discovered.has(externalId)
      ) {
        continue;
      }

      discovered.set(externalId, {
        externalId,
        canonicalUrl: this.canonicalUrl(externalId, marketplace),
        title: null,
        priceCents: null,
        currency: "USD",
        availability: "UNKNOWN",
        identifiers: [
          {
            identifierType: "ASIN",
            value: externalId,
          },
        ],
      });
    }

    return [...discovered.values()];
  }

  parse(status: number, html: string): NormalizedRetailerPayload {
    const lowercase = html.toLowerCase();
    const classification: RetailerResponseClassification =
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
      return emptyPayload(classification);
    }

    const productName = matchFirst(html, [
      /<span[^>]+id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i,
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    ]);

    const availabilityText = matchFirst(html, [
      /<div[^>]+id=["']availability["'][^>]*>([\s\S]*?)<\/div>/i,
    ]);

    const priceText = matchFirst(html, [
      /<span[^>]+class=["'][^"']*a-offscreen[^"']*["'][^>]*>(\$[\d,.]+)<\/span>/i,
      /"price"\s*:\s*"([\d.]+)"/i,
    ]);

    const availabilityLowercase = (
      availabilityText ?? ""
    ).toLowerCase();

    let availability: RetailerAvailability = "UNKNOWN";

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

    const merchant = matchFirst(html, [
      /<div[^>]+id=["']merchant-info["'][^>]*>([\s\S]*?)<\/div>/i,
    ]);

    return {
      classification,
      productName,
      priceCents: parsePriceCents(priceText),
      currency: "USD",
      availability,
      availabilityText,
      displayedRemainingQuantity: remainingMatch?.[1]
        ? Number.parseInt(remainingMatch[1], 10)
        : null,
      purchaseLimit: limitMatch?.[1]
        ? Number.parseInt(limitMatch[1], 10)
        : null,
      soldByRetailer:
        merchant === null
          ? null
          : /sold by\s+amazon(?:\.com)?/i.test(merchant),
      shipsFromRetailer:
        merchant === null
          ? null
          : /ships from\s+amazon(?:\.com)?/i.test(merchant),
    };
  }
}

export const SHIPPING_POLICY = Object.freeze({
  economyLetterMaxSubtotalCents: 5000,
  economyLetterPriceCents: 199,
  standardTrackedPriceCents: 799,
  freeTrackedMinimumCents: 7500,
  extraPackageFeeCents: 500,
  heavyPackageThresholdOunces: 800,
  heavyPackageFeeCents: 500,
});

/**
 * Calculates what the customer pays under the store's shipping policy.
 * Package count and weights must come from the packed order, not item count.
 * An additional package that is also over 50 lb is charged only once.
 */
export function calculateCustomerShipping({
  subtotalCents,
  packages = [],
  economyLetterEligible = false,
  selectedService = "standard",
}) {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) {
    throw new TypeError("subtotalCents must be a non-negative integer");
  }

  if (!Array.isArray(packages) || packages.length === 0) {
    throw new TypeError("At least one packed package is required");
  }

  const packageWeights = packages.map((entry) => {
    const weight = Number(entry?.weightOunces);
    if (!Number.isFinite(weight) || weight < 0) {
      throw new TypeError("Every package requires a non-negative weightOunces value");
    }
    return weight;
  });

  const economyAvailable =
    economyLetterEligible &&
    packages.length === 1 &&
    subtotalCents < SHIPPING_POLICY.economyLetterMaxSubtotalCents;

  if (selectedService === "economy") {
    if (!economyAvailable) {
      throw new RangeError("Economy Letter is not available for this order");
    }

    return {
      amountCents: SHIPPING_POLICY.economyLetterPriceCents,
      service: "economy-letter",
      freeShippingApplied: false,
      extraPackageCount: 0,
      firstPackageHeavy: false,
    };
  }

  const freeShippingApplied =
    subtotalCents >= SHIPPING_POLICY.freeTrackedMinimumCents;
  const baseCents = freeShippingApplied
    ? 0
    : SHIPPING_POLICY.standardTrackedPriceCents;
  const extraPackageCount = Math.max(0, packages.length - 1);
  const firstPackageHeavy =
    packageWeights[0] > SHIPPING_POLICY.heavyPackageThresholdOunces;

  // Every extra package costs $5, even when that package is also over 50 lb.
  // Only the first package can add the separate heavy-package charge.
  const surchargeCents =
    extraPackageCount * SHIPPING_POLICY.extraPackageFeeCents +
    (firstPackageHeavy ? SHIPPING_POLICY.heavyPackageFeeCents : 0);

  return {
    amountCents: baseCents + surchargeCents,
    service: "standard-tracked",
    freeShippingApplied,
    extraPackageCount,
    firstPackageHeavy,
  };
}

import type {
  ListingObservationChanges,
  RecordListingObservation,
} from "./types";

type ComparableObservation = Pick<
  RecordListingObservation,
  "availability" | "priceCents" | "stockQuantity"
>;

export const detectListingObservationChanges = (
  previous: ComparableObservation | null,
  current: ComparableObservation,
): ListingObservationChanges => {
  if (!previous) {
    return {
      availabilityChanged: false,
      priceChanged: false,
      quantityChanged: false,
    };
  }

  return {
    availabilityChanged:
      previous.availability !== current.availability,
    priceChanged: previous.priceCents !== current.priceCents,
    quantityChanged:
      (previous.stockQuantity ?? null) !==
      (current.stockQuantity ?? null),
  };
};

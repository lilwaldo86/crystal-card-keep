import type { ProductIdentifierType } from "./types";

export class InvalidProductIdentifierError extends Error {
  constructor(
    public readonly identifierType: ProductIdentifierType,
    public readonly value: string,
    reason: string,
  ) {
    super(`Invalid ${identifierType} identifier: ${reason}`);
    this.name = "InvalidProductIdentifierError";
  }
}

const requireCheckDigit = (
  digits: string,
  identifierType: "UPC" | "EAN",
): void => {
  const payload = digits.slice(0, -1);
  const suppliedCheckDigit = Number(digits.at(-1));
  let sum = 0;

  for (let index = 0; index < payload.length; index += 1) {
    const digit = Number(payload[index]);
    const positionFromRight = payload.length - index;
    sum += digit * (positionFromRight % 2 === 1 ? 3 : 1);
  }

  const expectedCheckDigit = (10 - (sum % 10)) % 10;

  if (suppliedCheckDigit !== expectedCheckDigit) {
    throw new InvalidProductIdentifierError(
      identifierType,
      digits,
      "check digit does not match",
    );
  }
};

export const normalizeAsin = (value: string): string => {
  const normalized = value.trim().toUpperCase();

  if (!/^[A-Z0-9]{10}$/.test(normalized)) {
    throw new InvalidProductIdentifierError(
      "ASIN",
      value,
      "expected exactly 10 letters or digits",
    );
  }

  return normalized;
};

export const normalizeUpc = (value: string): string => {
  const normalized = value.replace(/[\s-]/g, "");

  if (!/^\d{12}$/.test(normalized)) {
    throw new InvalidProductIdentifierError(
      "UPC",
      value,
      "expected exactly 12 digits",
    );
  }

  requireCheckDigit(normalized, "UPC");
  return normalized;
};

export const normalizeEan = (value: string): string => {
  const normalized = value.replace(/[\s-]/g, "");

  if (!/^\d{13}$/.test(normalized)) {
    throw new InvalidProductIdentifierError(
      "EAN",
      value,
      "expected exactly 13 digits",
    );
  }

  requireCheckDigit(normalized, "EAN");
  return normalized;
};

export const normalizeProductIdentifier = (
  identifierType: ProductIdentifierType,
  value: string,
): string => {
  switch (identifierType) {
    case "ASIN":
      return normalizeAsin(value);
    case "UPC":
      return normalizeUpc(value);
    case "EAN":
      return normalizeEan(value);
    case "ISBN":
    case "GTIN":
    case "MANUFACTURER_SKU": {
      const normalized = value.trim();

      if (!normalized) {
        throw new InvalidProductIdentifierError(
          identifierType,
          value,
          "value cannot be empty",
        );
      }

      return normalized;
    }
  }
};

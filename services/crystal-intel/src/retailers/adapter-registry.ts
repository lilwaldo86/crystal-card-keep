import type { RetailerAdapter } from "./types";

export class DuplicateRetailerAdapterError extends Error {
  constructor(public readonly retailerId: string) {
    super(`Retailer adapter already registered: ${retailerId}`);
    this.name = "DuplicateRetailerAdapterError";
  }
}

export class UnknownRetailerAdapterError extends Error {
  constructor(public readonly retailerId: string) {
    super(`Retailer adapter is not registered: ${retailerId}`);
    this.name = "UnknownRetailerAdapterError";
  }
}

export class RetailerAdapterRegistry {
  private readonly adapters = new Map<string, RetailerAdapter>();

  register(adapter: RetailerAdapter): void {
    if (this.adapters.has(adapter.retailerId)) {
      throw new DuplicateRetailerAdapterError(adapter.retailerId);
    }

    this.adapters.set(adapter.retailerId, adapter);
  }

  get(retailerId: string): RetailerAdapter {
    const adapter = this.adapters.get(retailerId);

    if (!adapter) {
      throw new UnknownRetailerAdapterError(retailerId);
    }

    return adapter;
  }

  has(retailerId: string): boolean {
    return this.adapters.has(retailerId);
  }

  list(): RetailerAdapter[] {
    return [...this.adapters.values()];
  }
}

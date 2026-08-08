const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function assertIntegerCents(cents: number, fn: string): void {
  if (!Number.isInteger(cents)) {
    throw new Error(`${fn} expects integer cents, got ${cents}`);
  }
}

/**
 * The single render-edge formatter for money. Every price in the app is
 * stored and passed around as integer cents — this is the only place that
 * should ever turn cents into a display string.
 */
export function formatPrice(cents: number): string {
  assertIntegerCents(cents, "formatPrice");
  return currencyFormatter.format(cents / 100);
}

/** Converts a decimal dollar amount to integer cents, e.g. 19.99 -> 1999. */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Converts integer cents to a decimal dollar amount, e.g. 1999 -> 19.99. */
export function fromCents(cents: number): number {
  assertIntegerCents(cents, "fromCents");
  return cents / 100;
}

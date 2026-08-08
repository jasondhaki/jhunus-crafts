export interface ShippingMethod {
  id: string;
  label: string;
  description: string;
  cents: number;
}

// The only place shipping cost is defined — the checkout API looks costs
// up by id here, never trusts a client-sent amount (CLAUDE.md rule 2).
export const SHIPPING_METHODS = {
  standard: {
    id: "standard",
    label: "Standard Shipping",
    description: "5-10 business days",
    cents: 500,
  },
  express: {
    id: "express",
    label: "Express Shipping",
    description: "2-3 business days",
    cents: 1500,
  },
} as const satisfies Record<string, ShippingMethod>;

export type ShippingMethodId = keyof typeof SHIPPING_METHODS;

export const SHIPPING_METHOD_IDS = Object.keys(SHIPPING_METHODS) as ShippingMethodId[];

export function getShippingMethod(id: string): ShippingMethod | undefined {
  return id in SHIPPING_METHODS ? SHIPPING_METHODS[id as ShippingMethodId] : undefined;
}

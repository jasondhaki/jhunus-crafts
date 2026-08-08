import { z } from "zod";
import { SHIPPING_METHOD_IDS, type ShippingMethodId } from "@/lib/shipping";

// IDs + quantities only — never a price, per CLAUDE.md rule 2. The server
// re-fetches every product and recomputes everything from the database.
export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const checkoutItemsSchema = z.array(checkoutItemSchema).min(1, "Your cart is empty").max(200);

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  line1: z.string().trim().min(1, "Street address is required").max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.string().trim().min(1, "State / province is required").max(100),
  postalCode: z.string().trim().min(1, "Postal code is required").max(20),
  country: z
    .string()
    .trim()
    .length(2, "Use a 2-letter country code")
    .toUpperCase()
    .default("US"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

export const shippingMethodIdSchema = z.enum(
  SHIPPING_METHOD_IDS as [ShippingMethodId, ...ShippingMethodId[]],
);

export const checkoutRequestSchema = z.object({
  items: checkoutItemsSchema,
  email: z.email(),
  shippingAddress: shippingAddressSchema,
  shippingMethodId: shippingMethodIdSchema,
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;
export type CheckoutRequestInput = z.infer<typeof checkoutRequestSchema>;

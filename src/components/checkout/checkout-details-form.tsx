"use client";

import { useId, useState, type FormEvent } from "react";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { checkoutRequestSchema, type ShippingAddressInput } from "@/lib/checkout-schemas";
import { SHIPPING_METHODS, type ShippingMethodId } from "@/lib/shipping";
import type { OrderLineIssue } from "@/lib/checkout-order";

const detailsSchema = checkoutRequestSchema.omit({ items: true });

export interface CheckoutDetails {
  email: string;
  shippingAddress: ShippingAddressInput;
  shippingMethodId: ShippingMethodId;
}

const EMPTY_ADDRESS: ShippingAddressInput = {
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
  phone: "",
};

const COUNTRIES = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" },
  { code: "AU", label: "Australia" },
];

export function CheckoutDetailsForm({
  initialEmail,
  shippingMethodId,
  onShippingMethodChange,
  submitting,
  submitError,
  lineIssues,
  onSubmit,
}: {
  initialEmail?: string;
  shippingMethodId: ShippingMethodId;
  onShippingMethodChange: (id: ShippingMethodId) => void;
  submitting: boolean;
  submitError: string | null;
  lineIssues: OrderLineIssue[];
  onSubmit: (details: CheckoutDetails) => void;
}) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [address, setAddress] = useState<ShippingAddressInput>(EMPTY_ADDRESS);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formId = useId();

  function updateAddress<K extends keyof ShippingAddressInput>(key: K, value: ShippingAddressInput[K]) {
    setAddress((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const parsed = detailsSchema.safeParse({ email, shippingAddress: address, shippingMethodId });
    if (!parsed.success) {
      // zod's flatten() only reports one level deep, and shippingAddress
      // is nested — walk the raw issues instead so a bad `line1` maps
      // back to the `line1` field, not a generic "shippingAddress" blob.
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const [first, second] = issue.path;
        if (first === "email") {
          errors.email = issue.message;
        } else if (first === "shippingAddress" && typeof second === "string") {
          errors[second] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    onSubmit(parsed.data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-bark">Contact</h2>
        <div>
          <label htmlFor={`${formId}-email`} className="mb-1.5 block text-sm font-medium text-bark">
            Email
          </label>
          <Input
            id={`${formId}-email`}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
          />
          <p className="mt-1.5 text-xs text-jute">We&rsquo;ll send your order confirmation here.</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-bark">Shipping Address</h2>
        <div>
          <label htmlFor={`${formId}-fullName`} className="mb-1.5 block text-sm font-medium text-bark">
            Full Name
          </label>
          <Input
            id={`${formId}-fullName`}
            autoComplete="name"
            required
            value={address.fullName}
            onChange={(event) => updateAddress("fullName", event.target.value)}
            error={fieldErrors.fullName}
          />
        </div>
        <div>
          <label htmlFor={`${formId}-line1`} className="mb-1.5 block text-sm font-medium text-bark">
            Street Address
          </label>
          <Input
            id={`${formId}-line1`}
            autoComplete="address-line1"
            required
            value={address.line1}
            onChange={(event) => updateAddress("line1", event.target.value)}
            error={fieldErrors.line1}
          />
        </div>
        <div>
          <label htmlFor={`${formId}-line2`} className="mb-1.5 block text-sm font-medium text-bark">
            Apartment, suite, etc. <span className="text-jute">(optional)</span>
          </label>
          <Input
            id={`${formId}-line2`}
            autoComplete="address-line2"
            value={address.line2}
            onChange={(event) => updateAddress("line2", event.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor={`${formId}-city`} className="mb-1.5 block text-sm font-medium text-bark">
              City
            </label>
            <Input
              id={`${formId}-city`}
              autoComplete="address-level2"
              required
              value={address.city}
              onChange={(event) => updateAddress("city", event.target.value)}
              error={fieldErrors.city}
            />
          </div>
          <div>
            <label htmlFor={`${formId}-state`} className="mb-1.5 block text-sm font-medium text-bark">
              State
            </label>
            <Input
              id={`${formId}-state`}
              autoComplete="address-level1"
              required
              value={address.state}
              onChange={(event) => updateAddress("state", event.target.value)}
              error={fieldErrors.state}
            />
          </div>
          <div>
            <label htmlFor={`${formId}-postalCode`} className="mb-1.5 block text-sm font-medium text-bark">
              Postal Code
            </label>
            <Input
              id={`${formId}-postalCode`}
              autoComplete="postal-code"
              required
              value={address.postalCode}
              onChange={(event) => updateAddress("postalCode", event.target.value)}
              error={fieldErrors.postalCode}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${formId}-country`} className="mb-1.5 block text-sm font-medium text-bark">
              Country
            </label>
            <Select
              id={`${formId}-country`}
              autoComplete="country"
              value={address.country}
              onChange={(event) => updateAddress("country", event.target.value)}
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor={`${formId}-phone`} className="mb-1.5 block text-sm font-medium text-bark">
              Phone <span className="text-jute">(optional)</span>
            </label>
            <Input
              id={`${formId}-phone`}
              type="tel"
              autoComplete="tel"
              value={address.phone}
              onChange={(event) => updateAddress("phone", event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-bark">Delivery Method</h2>
        <div className="space-y-3" role="radiogroup" aria-label="Delivery method">
          {Object.values(SHIPPING_METHODS).map((method) => (
            <label
              key={method.id}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-md border p-4 transition-colors duration-200 ease-out",
                shippingMethodId === method.id
                  ? "border-terracotta bg-terracotta/5"
                  : "border-hairline hover:border-jute",
              )}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shippingMethod"
                  value={method.id}
                  checked={shippingMethodId === method.id}
                  onChange={() => onShippingMethodChange(method.id)}
                  className="size-4 accent-terracotta"
                />
                <span>
                  <span className="block text-sm font-medium text-bark">{method.label}</span>
                  <span className="block text-xs text-jute">{method.description}</span>
                </span>
              </span>
              <span className="text-sm text-bark">{formatPrice(method.cents)}</span>
            </label>
          ))}
        </div>
      </section>

      {lineIssues.length > 0 && (
        <div
          role="alert"
          className="space-y-1 rounded-md border border-terracotta/40 bg-terracotta/10 p-4 text-sm text-terracotta"
        >
          {lineIssues.map((issue) => (
            <p key={issue.productId} className="flex gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {issue.availableStock <= 0
                  ? `${issue.title} is now sold out and was removed from your cart.`
                  : `${issue.title} only has ${issue.availableStock} left — your cart was updated.`}
              </span>
            </p>
          ))}
          <p>Please review your cart and try again.</p>
        </div>
      )}

      {submitError && (
        <p role="alert" className="text-sm text-terracotta">
          {submitError}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" loading={submitting}>
        Continue to Payment
      </Button>
    </form>
  );
}

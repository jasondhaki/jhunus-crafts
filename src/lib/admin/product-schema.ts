import { z } from "zod";
import { slugify } from "@/lib/slugify";
import { toCents } from "@/lib/money";

const optionalTrimmed = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const productFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(200)
    .transform((value) => slugify(value))
    .refine((value) => value.length > 0, "Slug must contain at least one letter or number"),
  description: z.string().trim().min(1, "Description is required").max(5000),
  // Entered in dollars, converted to integer cents by toProductData below —
  // CLAUDE.md rule 1: money is only ever stored/passed as Int cents.
  price: z.coerce.number().positive("Price must be greater than 0"),
  compareAtPrice: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().positive("Compare-at price must be greater than 0").optional(),
  ),
  stock: z.coerce.number().int("Stock must be a whole number").min(0, "Stock cannot be negative"),
  dimensions: optionalTrimmed(200),
  materials: z.string().trim().min(1, "Materials is required").max(200),
  weave: optionalTrimmed(100),
  color: optionalTrimmed(100),
  categoryId: z.string().min(1, "Category is required"),
  isFeatured: z.preprocess((value) => value === "on", z.boolean()),
  isActive: z.preprocess((value) => value === "on", z.boolean()),
  images: z.array(z.string().min(1)).min(1, "At least one image is required").max(10, "Up to 10 images"),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;

export function parseProductFormData(formData: FormData) {
  let images: unknown = [];
  try {
    images = JSON.parse(String(formData.get("images") ?? "[]"));
  } catch {
    images = [];
  }

  return productFormSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice"),
    stock: formData.get("stock"),
    dimensions: formData.get("dimensions"),
    materials: formData.get("materials"),
    weave: formData.get("weave"),
    color: formData.get("color"),
    categoryId: formData.get("categoryId"),
    isFeatured: formData.get("isFeatured"),
    isActive: formData.get("isActive"),
    images,
  });
}

// Pure mapping from validated form input to the Prisma write shape — kept
// separate and exported so it's unit-testable without touching the DB,
// same reasoning as buildCartDetails/buildOrderDraft.
export function toProductData(input: ProductFormInput) {
  return {
    title: input.title,
    slug: input.slug,
    description: input.description,
    priceCents: toCents(input.price),
    compareAtCents: input.compareAtPrice !== undefined ? toCents(input.compareAtPrice) : null,
    stock: input.stock,
    dimensions: input.dimensions || null,
    materials: input.materials,
    weave: input.weave || null,
    color: input.color || null,
    categoryId: input.categoryId,
    isFeatured: input.isFeatured,
    isActive: input.isActive,
    images: input.images,
  };
}

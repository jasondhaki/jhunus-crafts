"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { parseProductFormData, toProductData } from "@/lib/admin/product-schema";
import { revalidateCatalogPaths } from "@/lib/revalidate-catalog";
import { extractCloudinaryPublicId, deleteCloudinaryAsset } from "@/lib/cloudinary";
import type { ActionResult } from "@/lib/admin/action-result";

export interface ProductActionResult extends ActionResult {
  productId?: string;
}

const FIX_ERRORS_MESSAGE = "Please fix the errors below.";

export async function createProductAction(
  _prev: ProductActionResult,
  formData: FormData,
): Promise<ProductActionResult> {
  // Every admin Server Action independently re-checks ADMIN — middleware
  // protects the /admin route tree, but a Server Action can be invoked
  // directly, bypassing route middleware entirely (CLAUDE.md rule 7).
  await requireAdmin();

  const parsed = parseProductFormData(formData);
  if (!parsed.success) {
    return { success: false, message: FIX_ERRORS_MESSAGE, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await db.product.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return {
      success: false,
      message: FIX_ERRORS_MESSAGE,
      fieldErrors: { slug: ["This slug is already in use."] },
    };
  }

  let product;
  try {
    product = await db.product.create({ data: toProductData(parsed.data) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        success: false,
        message: FIX_ERRORS_MESSAGE,
        fieldErrors: { categoryId: ["Selected category no longer exists."] },
      };
    }
    throw error;
  }

  revalidateCatalogPaths(product.slug);
  return { success: true, message: "Product created.", productId: product.id };
}

export async function updateProductAction(
  productId: string,
  _prev: ProductActionResult,
  formData: FormData,
): Promise<ProductActionResult> {
  await requireAdmin();
  const parsedId = z.string().min(1).parse(productId);

  const parsed = parseProductFormData(formData);
  if (!parsed.success) {
    return { success: false, message: FIX_ERRORS_MESSAGE, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const current = await db.product.findUnique({ where: { id: parsedId } });
  if (!current) {
    return { success: false, message: "Product not found." };
  }

  if (parsed.data.slug !== current.slug) {
    const existing = await db.product.findUnique({ where: { slug: parsed.data.slug } });
    if (existing) {
      return {
        success: false,
        message: FIX_ERRORS_MESSAGE,
        fieldErrors: { slug: ["This slug is already in use."] },
      };
    }
  }

  let product;
  try {
    product = await db.product.update({ where: { id: parsedId }, data: toProductData(parsed.data) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        success: false,
        message: FIX_ERRORS_MESSAGE,
        fieldErrors: { categoryId: ["Selected category no longer exists."] },
      };
    }
    throw error;
  }

  revalidateCatalogPaths(product.slug, current.slug);
  return { success: true, message: "Product updated.", productId: product.id };
}

// Bound-arg + (prevState, formData) shape throughout this file — even for
// actions like this one with no real form fields — so every admin mutation
// uniformly runs through useActionState (for the typed ActionResult →
// toast pipeline) and useFormStatus (for the submit button's pending
// state), rather than mixing that pattern with plain onClick handlers.
export async function deleteProductAction(
  productId: string,
  _prev: ActionResult,
  _formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsedId = z.string().min(1).parse(productId);

  const product = await db.product.findUnique({ where: { id: parsedId } });
  if (!product) {
    return { success: false, message: "Product not found." };
  }

  // A hard delete would orphan every historical OrderItem that references
  // this product (invoices must never lose their line items) — soft
  // delete instead whenever any order has ever included it.
  const orderItemCount = await db.orderItem.count({ where: { productId: parsedId } });

  if (orderItemCount > 0) {
    const updated = await db.product.update({ where: { id: parsedId }, data: { isActive: false } });
    revalidateCatalogPaths(updated.slug);
    return {
      success: true,
      message: "This product is referenced by past orders, so it was deactivated instead of deleted.",
    };
  }

  await db.product.delete({ where: { id: parsedId } });

  // Best-effort Cloudinary cleanup — never block the delete on it. Skips
  // silently for non-Cloudinary URLs (e.g. the seeded Unsplash images).
  for (const url of product.images) {
    const publicId = extractCloudinaryPublicId(url);
    if (publicId) {
      await deleteCloudinaryAsset(publicId).catch((error) => {
        console.error(`Failed to delete Cloudinary asset ${publicId}`, error);
      });
    }
  }

  revalidateCatalogPaths(product.slug);
  return { success: true, message: "Product deleted." };
}

const stockSchema = z.coerce.number().int("Stock must be a whole number").min(0, "Stock cannot be negative");

export async function updateStockAction(
  productId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsedId = z.string().min(1).parse(productId);
  const parsedStock = stockSchema.safeParse(formData.get("stock"));

  if (!parsedStock.success) {
    return { success: false, message: "Stock must be a non-negative whole number." };
  }

  const product = await db.product.update({ where: { id: parsedId }, data: { stock: parsedStock.data } });
  revalidateCatalogPaths(product.slug);
  return { success: true, message: `Stock for "${product.title}" updated to ${product.stock}.` };
}

export async function toggleActiveAction(
  productId: string,
  _prev: ActionResult,
  _formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsedId = z.string().min(1).parse(productId);

  const current = await db.product.findUnique({ where: { id: parsedId }, select: { isActive: true } });
  if (!current) {
    return { success: false, message: "Product not found." };
  }

  const product = await db.product.update({
    where: { id: parsedId },
    data: { isActive: !current.isActive },
  });

  revalidateCatalogPaths(product.slug);
  return { success: true, message: `${product.title} is now ${product.isActive ? "active" : "inactive"}.` };
}

export async function bulkSetActiveAction(
  productIds: string[],
  isActive: boolean,
  _prev: ActionResult,
  _formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsedIds = z.array(z.string().min(1)).min(1).parse(productIds);

  const products = await db.product.findMany({ where: { id: { in: parsedIds } }, select: { slug: true } });
  if (products.length === 0) {
    return { success: false, message: "No matching products found." };
  }

  await db.product.updateMany({ where: { id: { in: parsedIds } }, data: { isActive } });

  for (const product of products) revalidateCatalogPaths(product.slug);

  return {
    success: true,
    message: `${products.length} product${products.length === 1 ? "" : "s"} ${isActive ? "activated" : "deactivated"}.`,
  };
}

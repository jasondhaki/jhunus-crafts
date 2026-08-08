"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { slugify } from "@/lib/slugify";
import type { ActionResult } from "@/lib/admin/action-result";

const FIX_ERRORS_MESSAGE = "Please fix the errors below.";

const categoryNameSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
});

function revalidateCategoryPaths() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

export async function createCategoryAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = categoryNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { success: false, message: FIX_ERRORS_MESSAGE, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const slug = slugify(parsed.data.name);
  if (!slug) {
    return {
      success: false,
      message: FIX_ERRORS_MESSAGE,
      fieldErrors: { name: ["Name must contain at least one letter or number."] },
    };
  }

  try {
    await db.category.create({ data: { name: parsed.data.name, slug } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        success: false,
        message: FIX_ERRORS_MESSAGE,
        fieldErrors: { name: ["A category with this name already exists."] },
      };
    }
    throw error;
  }

  revalidateCategoryPaths();
  return { success: true, message: "Category created." };
}

export async function renameCategoryAction(
  categoryId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsedId = z.string().min(1).parse(categoryId);

  const parsed = categoryNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { success: false, message: FIX_ERRORS_MESSAGE, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const slug = slugify(parsed.data.name);

  try {
    await db.category.update({ where: { id: parsedId }, data: { name: parsed.data.name, slug } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        success: false,
        message: FIX_ERRORS_MESSAGE,
        fieldErrors: { name: ["A category with this name already exists."] },
      };
    }
    throw error;
  }

  revalidateCategoryPaths();
  return { success: true, message: "Category updated." };
}

export async function deleteCategoryAction(
  categoryId: string,
  _prev: ActionResult,
  _formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsedId = z.string().min(1).parse(categoryId);

  // Product.categoryId is required (not nullable), so a category still in
  // use can't be deleted without orphaning those products' FK — checked
  // proactively here for a friendly message instead of a raw constraint
  // error surfacing.
  const productCount = await db.product.count({ where: { categoryId: parsedId } });
  if (productCount > 0) {
    return {
      success: false,
      message: `Can't delete — ${productCount} product${productCount === 1 ? "" : "s"} still use this category.`,
    };
  }

  await db.category.delete({ where: { id: parsedId } });
  revalidateCategoryPaths();
  return { success: true, message: "Category deleted." };
}

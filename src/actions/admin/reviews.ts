"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import type { ActionResult } from "@/lib/admin/action-result";

// Bound-arg + (prevState, formData) shape throughout — see the comment on
// deleteProductAction in admin/products.ts for why, even for actions with
// no real form fields.
export async function approveReviewAction(
  reviewId: string,
  _prev: ActionResult,
  _formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsedId = z.string().min(1).parse(reviewId);

  const review = await db.review
    .update({
      where: { id: parsedId },
      data: { isApproved: true },
      include: { product: { select: { slug: true } } },
    })
    .catch(() => null);

  if (!review) {
    return { success: false, message: "Review not found." };
  }

  revalidatePath("/admin/reviews");
  revalidatePath(`/shop/${review.product.slug}`);
  return { success: true, message: "Review approved and published." };
}

// "Reject" has no separate DB state to represent it (Review only has a
// boolean isApproved, not a three-state pending/approved/rejected) — a
// rejected review is removed outright rather than left sitting in the
// pending queue forever with isApproved still false and no way to
// distinguish "not yet decided" from "decided against."
export async function rejectReviewAction(
  reviewId: string,
  _prev: ActionResult,
  _formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsedId = z.string().min(1).parse(reviewId);

  const review = await db.review
    .delete({ where: { id: parsedId }, include: { product: { select: { slug: true } } } })
    .catch(() => null);

  if (!review) {
    return { success: false, message: "Review not found." };
  }

  revalidatePath("/admin/reviews");
  revalidatePath(`/shop/${review.product.slug}`);
  return { success: true, message: "Review rejected and removed." };
}

// Lets an admin walk back a mistaken approval from the "Approved" tab.
export async function unapproveReviewAction(
  reviewId: string,
  _prev: ActionResult,
  _formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsedId = z.string().min(1).parse(reviewId);

  const review = await db.review
    .update({
      where: { id: parsedId },
      data: { isApproved: false },
      include: { product: { select: { slug: true } } },
    })
    .catch(() => null);

  if (!review) {
    return { success: false, message: "Review not found." };
  }

  revalidatePath("/admin/reviews");
  revalidatePath(`/shop/${review.product.slug}`);
  return { success: true, message: "Review moved back to pending." };
}

import { db } from "@/lib/db";

export async function getPendingReviews() {
  return db.review.findMany({
    where: { isApproved: false },
    include: { product: { select: { title: true, slug: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getApprovedReviews() {
  return db.review.findMany({
    where: { isApproved: true },
    include: { product: { select: { title: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

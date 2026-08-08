import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-guards";
import { getApprovedReviews, getPendingReviews } from "@/lib/admin/review-query";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/shop/star-rating";
import { ApprovedReviewActions, PendingReviewActions } from "@/components/admin/review-action-buttons";

export const metadata: Metadata = {
  title: "Reviews",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

function firstSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  await requireAdmin();
  const raw = await searchParams;
  const tab = firstSearchParam(raw.tab) === "approved" ? "approved" : "pending";

  const reviews = tab === "pending" ? await getPendingReviews() : await getApprovedReviews();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-bark">Reviews</h1>

      <div className="flex w-fit gap-1 rounded-md border border-gray-300 bg-white p-1">
        <Link
          href="/admin/reviews"
          className={cn(
            "rounded px-3 py-1 text-sm font-medium transition-colors duration-200 ease-out",
            tab === "pending" ? "bg-terracotta text-cream" : "text-gray-600 hover:bg-gray-100",
          )}
        >
          Pending
        </Link>
        <Link
          href="/admin/reviews?tab=approved"
          className={cn(
            "rounded px-3 py-1 text-sm font-medium transition-colors duration-200 ease-out",
            tab === "approved" ? "bg-terracotta text-cream" : "text-gray-600 hover:bg-gray-100",
          )}
        >
          Approved
        </Link>
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          {tab === "pending" ? "No reviews waiting for review." : "No approved reviews yet."}
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    <span className="text-sm font-medium text-bark">{review.author}</span>
                  </div>
                  <Link
                    href={`/shop/${review.product.slug}`}
                    className="mt-1 inline-block text-xs text-terracotta hover:opacity-70"
                  >
                    {review.product.title}
                  </Link>
                  <p className="mt-2 text-sm text-gray-600">{review.comment}</p>
                  <p className="mt-2 text-xs text-gray-400">{dateFormatter.format(review.createdAt)}</p>
                </div>
                {tab === "pending" ? (
                  <PendingReviewActions reviewId={review.id} />
                ) : (
                  <ApprovedReviewActions reviewId={review.id} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { StarRating } from "@/components/shop/star-rating";

interface Review {
  id: string;
  rating: number;
  comment: string;
  author: string;
  createdAt: Date;
}

function RatingDistribution({ reviews }: { reviews: Review[] }) {
  const total = reviews.length;

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = reviews.filter((review) => review.rating === star).length;
        const percent = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-3 text-sm">
            <span className="w-12 shrink-0 text-jute">{star} star</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-jute/10">
              <div className="h-full bg-terracotta" style={{ width: `${percent}%` }} />
            </div>
            <span className="w-6 shrink-0 text-right text-jute">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount : 0;

  return (
    <section id="reviews" className="scroll-mt-24 py-16">
      <h2 className="font-serif text-3xl text-bark">Reviews</h2>

      {reviewCount === 0 ? (
        <p className="mt-4 text-jute">
          No reviews yet — be the first to share what you think of this piece.
        </p>
      ) : (
        <div className="mt-8 grid gap-12 lg:grid-cols-[280px_1fr]">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-5xl text-bark">{averageRating.toFixed(1)}</span>
              <div>
                <StarRating rating={averageRating} />
                <p className="mt-1 text-sm text-jute">
                  {reviewCount} review{reviewCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="mt-6">
              <RatingDistribution reviews={reviews} />
            </div>
          </div>

          <ul className="space-y-8">
            {reviews.map((review) => (
              <li key={review.id} className="border-b border-hairline pb-8 last:border-b-0">
                <div className="flex items-center justify-between">
                  <StarRating rating={review.rating} />
                  <time
                    dateTime={review.createdAt.toISOString()}
                    className="text-xs text-jute"
                  >
                    {new Intl.DateTimeFormat("en-US", {
                      month: "long",
                      year: "numeric",
                    }).format(review.createdAt)}
                  </time>
                </div>
                <p className="mt-3 font-serif text-lg text-bark">{review.author}</p>
                <p className="mt-1 text-sm text-jute">{review.comment}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

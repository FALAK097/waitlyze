"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { resolveReferralReview } from "@/app/actions/referral-review";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatProductDate } from "@/lib/product-date.mjs";

const reasonText = {
  same_browser:
    "Invitee and referrer used the same browser identifier. This can be legitimate; review before granting credit.",
};

function formatDate(date) {
  return formatProductDate(date);
}

export function ReferralReview({
  waitListId,
  initialReviews,
  initialLoadError = false,
  canManage,
}) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [notes, setNotes] = useState({});
  const [errors, setErrors] = useState({});
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => setReviews(initialReviews), [initialReviews]);

  async function resolve(review, status) {
    if ((notes[review.id] || "").trim().length < 8) {
      setErrors((current) => ({
        ...current,
        [review.id]: "Add a decision note of at least 8 characters.",
      }));
      document.getElementById(`review-note-${review.id}`)?.focus();
      toast.error("Add a decision note of at least 8 characters.");
      return;
    }
    setPendingId(review.id);
    setErrors((current) => ({ ...current, [review.id]: "" }));
    try {
      const response = await resolveReferralReview(
        waitListId,
        review.id,
        status,
        notes[review.id] || "",
      );
      if (response.error) {
        setErrors((current) => ({ ...current, [review.id]: response.error }));
        toast.error(response.error);
      } else {
        toast.success(status === "APPROVED" ? "Referral approved." : "Referral excluded.");
        setReviews((current) =>
          current.map((item) =>
            item.id === review.id
              ? {
                  ...item,
                  reviewStatus: status,
                  resolution: (notes[review.id] || "").trim(),
                  reviewedAt: new Date().toISOString(),
                }
              : item,
          ),
        );
      }
    } catch {
      setErrors((current) => ({
        ...current,
        [review.id]: "Could not save the decision. Try again.",
      }));
      toast.error("Could not save the decision. Try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section aria-labelledby="referral-review-title">
      <header className="mb-7">
        <h2 id="referral-review-title" className="mb-2! text-lg!">
          Referral review
        </h2>
        <p className="product-description">Check flagged referrals before granting credit.</p>
      </header>
      {initialLoadError ? (
        <div className="py-12 text-center" role="alert">
          <p className="text-product-text-secondary">Referral reviews couldn’t be loaded.</p>
          <Button variant="outline" onClick={() => router.refresh()}>
            Try again
          </Button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center">
          <h3 className="mb-2!">No referrals need review</h3>
          <p className="text-product-text-secondary">Flagged referrals will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-9">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="min-w-0 border-b border-product-border-subtle pb-7 last-of-type:border-0"
            >
              <header className="mb-4.5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="m-0 wrap-anywhere">{review.signUp.email}</h3>
                <span
                  className={`product-status max-[640px]:leading-normal ${review.reviewStatus === "APPROVED" ? "product-status-success" : ""}`}
                >
                  {review.reviewStatus === "NEEDS_REVIEW"
                    ? "Needs review"
                    : review.reviewStatus === "APPROVED"
                      ? "Approved"
                      : "Excluded"}
                </span>
              </header>
              <dl className="mb-4.5 flex flex-wrap gap-x-8 gap-y-4">
                <div>
                  <dt className="mb-1.5 text-caption text-product-text-secondary">Referred by</dt>
                  <dd className="m-0 text-sm wrap-anywhere">
                    {review.referredBy?.email || "Referrer unavailable"}
                  </dd>
                </div>
                <div>
                  <dt className="mb-1.5 text-caption text-product-text-secondary">Joined</dt>
                  <dd className="m-0 text-sm wrap-anywhere">
                    {formatDate(review.signUp.createdAt)}
                  </dd>
                </div>
              </dl>
              <p className="mb-4! max-w-prose text-sm leading-relaxed text-product-text-secondary">
                {reasonText[review.reviewReason] ||
                  "This referral needs a manual eligibility decision."}
              </p>
              {review.reviewStatus === "NEEDS_REVIEW" && canManage && (
                <div className="mt-6 grid max-w-130 gap-2 max-[640px]:[&_textarea]:text-base">
                  <Label htmlFor={`review-note-${review.id}`}>Decision note</Label>
                  <div className="[&_textarea]:min-h-18 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-product-border-control [&_textarea]:bg-product-bg-surface [&_textarea]:px-3 [&_textarea]:py-2.5 [&_textarea]:text-sm [&_textarea]:leading-normal [&_textarea]:text-product-text-primary [&_textarea:focus-visible]:outline-2 [&_textarea:focus-visible]:outline-offset-2 [&_textarea:focus-visible]:outline-product-focus">
                    <Textarea
                      id={`review-note-${review.id}`}
                      aria-invalid={Boolean(errors[review.id])}
                      aria-describedby={`review-note-hint-${review.id}`}
                      minLength={8}
                      maxLength={240}
                      value={notes[review.id] || ""}
                      onChange={(event) =>
                        setNotes((current) => ({ ...current, [review.id]: event.target.value }))
                      }
                      rows={2}
                      placeholder="Explain your decision"
                    />
                  </div>
                  <p
                    id={`review-note-hint-${review.id}`}
                    className="mb-4! text-sm leading-relaxed text-product-text-secondary"
                  >
                    Use 8–240 characters.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 [&_button]:min-h-11">
                    <Button
                      variant="outline"
                      disabled={Boolean(pendingId)}
                      onClick={() => resolve(review, "APPROVED")}
                    >
                      {pendingId === review.id ? "Saving…" : "Approve credit"}
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={Boolean(pendingId)}
                      onClick={() => resolve(review, "EXCLUDED")}
                    >
                      Exclude
                    </Button>
                  </div>
                </div>
              )}
              {review.resolution && (
                <p className="text-sm leading-relaxed">Decision note: {review.resolution}</p>
              )}
            </article>
          ))}
          {!canManage && (
            <p className="mb-4! text-sm leading-relaxed text-product-text-secondary">
              An owner or admin can resolve referral reviews.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

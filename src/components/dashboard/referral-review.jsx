"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";

import { resolveReferralReview } from "@/app/actions/referral-review";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatProductDate } from "@/lib/product-date.mjs";
import { cn } from "@/lib/utils";

const reasonText = {
  same_browser:
    "Invitee and referrer used the same browser identifier. This can be legitimate; review before granting credit.",
};

function formatDate(date) {
  return formatProductDate(date);
}

function statusPill(reviewStatus) {
  const label =
    reviewStatus === "NEEDS_REVIEW"
      ? "Needs review"
      : reviewStatus === "APPROVED"
        ? "Approved"
        : "Excluded";
  return (
    <span
      className={cn(
        "product-status",
        reviewStatus === "APPROVED" && "product-status-success",
        reviewStatus === "EXCLUDED" && "product-status-danger",
      )}
    >
      <span aria-hidden="true">●</span> {label}
    </span>
  );
}

export function ReferralReview({
  waitListId,
  initialReviews,
  initialLoadError = false,
  canManage,
}) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [expandedId, setExpandedId] = useState(null);
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
        setExpandedId(null);
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
        <>
          <div className="overflow-x-auto [&_td]:px-4 [&_td]:py-4.5 [&_td:first-child]:pl-0 [&_td:last-child]:pr-0 [&_th]:border-b [&_th]:px-4 [&_th]:text-caption [&_th:first-child]:pl-0 [&_th:last-child]:pr-0">
            <Table className="w-full min-w-192 table-fixed border-collapse text-left sm:table-auto">
              <TableHeader className="text-product-text-secondary">
                <TableRow>
                  <TableHead scope="col" className="font-medium">
                    Email
                  </TableHead>
                  <TableHead scope="col" className="hidden font-medium sm:table-cell">
                    Referred by
                  </TableHead>
                  <TableHead scope="col" className="hidden font-medium sm:table-cell">
                    Joined
                  </TableHead>
                  <TableHead scope="col" className="font-medium">
                    Status
                  </TableHead>
                  <TableHead scope="col" className="text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <Fragment key={review.id}>
                    <TableRow>
                    <TableCell className="font-medium break-all">
                      {review.signUp.email}
                    </TableCell>
                      <TableCell className="hidden max-w-44 truncate text-product-text-secondary sm:table-cell">
                        <span
                          className="block truncate"
                          title={review.referredBy?.email || undefined}
                        >
                          {review.referredBy?.email || "Referrer unavailable"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-product-text-secondary sm:table-cell">
                        <span title={formatDate(review.signUp.createdAt)}>
                          {formatDate(review.signUp.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>{statusPill(review.reviewStatus)}</TableCell>
                      <TableCell className="text-right">
                        {review.reviewStatus === "NEEDS_REVIEW" && canManage ? (
                          <Button
                            type="button"
                            variant={expandedId === review.id ? "secondary" : "outline"}
                            size="sm"
                            aria-expanded={expandedId === review.id}
                            onClick={() =>
                              setExpandedId((current) => (current === review.id ? null : review.id))
                            }
                          >
                            {expandedId === review.id ? "Close" : "Review"}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                    {expandedId === review.id &&
                    review.reviewStatus === "NEEDS_REVIEW" &&
                    canManage ? (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-product-bg-inset">
                          <div className="grid max-w-130 gap-2 py-2">
                            <p className="m-0 text-sm leading-relaxed text-product-text-secondary">
                              {reasonText[review.reviewReason] ||
                                "This referral needs a manual eligibility decision."}
                            </p>
                            <Label htmlFor={`review-note-${review.id}`}>Decision note</Label>
                            <Textarea
                              id={`review-note-${review.id}`}
                              aria-invalid={Boolean(errors[review.id])}
                              aria-describedby={`review-note-hint-${review.id}`}
                              minLength={8}
                              maxLength={240}
                              value={notes[review.id] || ""}
                              onChange={(event) =>
                                setNotes((current) => ({
                                  ...current,
                                  [review.id]: event.target.value,
                                }))
                              }
                              rows={2}
                              placeholder="Explain your decision"
                              className="max-[640px]:text-base"
                            />
                            <p
                              id={`review-note-hint-${review.id}`}
                              className="m-0 text-sm leading-relaxed text-product-text-secondary"
                            >
                              Use 8–240 characters.
                            </p>
                            {errors[review.id] ? (
                              <p className="m-0 text-sm text-product-danger-text" role="alert">
                                {errors[review.id]}
                              </p>
                            ) : null}
                            <div className="flex flex-wrap justify-end gap-2 [&_button]:min-h-11">
                              <Button
                                variant="ghost"
                                disabled={Boolean(pendingId)}
                                onClick={() => setExpandedId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="outline"
                                disabled={Boolean(pendingId)}
                                onClick={() => resolve(review, "EXCLUDED")}
                              >
                                Exclude
                              </Button>
                              <Button
                                disabled={Boolean(pendingId)}
                                onClick={() => resolve(review, "APPROVED")}
                              >
                                {pendingId === review.id ? "Saving…" : "Approve credit"}
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
          {!canManage && (
            <p className="mt-4 text-sm leading-relaxed text-product-text-secondary">
              An owner or admin can resolve referral reviews.
            </p>
          )}
        </>
      )}
    </section>
  );
}

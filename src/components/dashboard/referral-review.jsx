"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { resolveReferralReview } from "@/app/actions/referral-review";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  const [selectedId, setSelectedId] = useState(null);
  const [notes, setNotes] = useState({});
  const [errors, setErrors] = useState({});
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => setReviews(initialReviews), [initialReviews]);

  const activeReview = reviews.find((item) => item.id === selectedId) || null;

  function handleOpenChange(nextOpen) {
    if (!nextOpen && pendingId) return;
    if (!nextOpen) setSelectedId(null);
  }

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
        setSelectedId(null);
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
          <div className="overflow-x-auto [&_td]:px-3 [&_td]:py-4.5 [&_td:first-child]:pl-0 [&_td:last-child]:pr-0 [&_th]:border-b [&_th]:px-3 [&_th]:text-caption [&_th:first-child]:pl-0 [&_th:last-child]:pr-0">
            <Table className="w-full min-w-192 table-fixed border-collapse text-left sm:table-auto">
              <TableHeader className="text-product-text-secondary">
                <TableRow>
                  <TableHead scope="col">Email</TableHead>
                  <TableHead scope="col" className="hidden sm:table-cell">
                    Referred by
                  </TableHead>
                  <TableHead scope="col" className="hidden sm:table-cell">
                    Joined
                  </TableHead>
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col" className="w-10 text-right">
                    <span className="sr-only">Open review</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow
                    key={review.id}
                    tabIndex={0}
                    aria-label={`Review referral for ${review.signUp.email}`}
                    className="group/row cursor-pointer hover:bg-product-bg-inset/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-product-focus"
                    onClick={() => setSelectedId(review.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(review.id);
                      }
                    }}
                  >
                    <TableCell>
                      <span className="font-medium break-all">{review.signUp.email}</span>
                    </TableCell>
                    <TableCell className="hidden max-w-44 sm:table-cell">
                      <span
                        className="block truncate text-product-text-secondary"
                        title={review.referredBy?.email || undefined}
                      >
                        {review.referredBy?.email || "Referrer unavailable"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap sm:table-cell">
                      <span
                        className="text-product-text-secondary tabular-nums"
                        title={formatDate(review.signUp.createdAt)}
                      >
                        {formatDate(review.signUp.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="grid gap-0.5">
                        <div>{statusPill(review.reviewStatus)}</div>
                        {review.resolution ? (
                          <span className="text-micro text-product-text-secondary">
                            {review.resolution}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center justify-end text-product-text-secondary transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-product-text-primary">
                        <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!canManage && (
            <p className="mt-4 text-sm leading-relaxed text-product-text-secondary">
              An owner or admin can resolve referral reviews.
            </p>
          )}
          <Sheet open={Boolean(activeReview)} onOpenChange={handleOpenChange}>
            <SheetContent className="sm:max-w-md">
              {activeReview ? (
                <>
                  <SheetHeader>
                    <SheetTitle>Referral review</SheetTitle>
                    <SheetDescription>
                      Check this flagged referral before granting credit.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-4 overflow-y-auto px-4 pb-4">
                    <dl className="grid gap-3 text-sm">
                      <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
                        <dt className="text-product-text-secondary">Invitee</dt>
                        <dd className="font-medium break-all">{activeReview.signUp.email}</dd>
                      </div>
                      <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
                        <dt className="text-product-text-secondary">Referred by</dt>
                        <dd className="break-all">
                          {activeReview.referredBy?.email || "Referrer unavailable"}
                        </dd>
                      </div>
                      <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
                        <dt className="text-product-text-secondary">Joined</dt>
                        <dd className="tabular-nums">
                          {formatDate(activeReview.signUp.createdAt)}
                        </dd>
                      </div>
                      <div className="grid grid-cols-[104px_minmax(0,1fr)] items-center gap-3">
                        <dt className="text-product-text-secondary">Status</dt>
                        <dd>{statusPill(activeReview.reviewStatus)}</dd>
                      </div>
                    </dl>
                    <div className="product-field border-t border-product-border-subtle pt-4">
                      <span className="text-micro font-bold tracking-widest text-product-text-secondary uppercase">
                        Flagged reason
                      </span>
                      <p className="m-0 text-sm leading-relaxed text-product-text-primary">
                        {reasonText[activeReview.reviewReason] ||
                          "This referral needs a manual eligibility decision."}
                      </p>
                    </div>
                    {activeReview.reviewStatus === "NEEDS_REVIEW" && canManage ? (
                      <>
                        <div className="product-field">
                          <div className="flex items-center justify-between gap-2">
                            <Label htmlFor={`review-note-${activeReview.id}`}>Decision note</Label>
                            <span
                              id={`review-note-hint-${activeReview.id}`}
                              className="text-micro text-product-text-secondary"
                            >
                              8–240 characters
                            </span>
                          </div>
                          <Textarea
                            id={`review-note-${activeReview.id}`}
                            aria-invalid={Boolean(errors[activeReview.id])}
                            aria-describedby={`review-note-hint-${activeReview.id}`}
                            minLength={8}
                            maxLength={240}
                            value={notes[activeReview.id] || ""}
                            onChange={(event) =>
                              setNotes((current) => ({
                                ...current,
                                [activeReview.id]: event.target.value,
                              }))
                            }
                            className="min-h-28"
                            placeholder="Explain why you are approving or excluding this referral…"
                            disabled={Boolean(pendingId)}
                          />
                          {errors[activeReview.id] ? (
                            <p className="m-0 text-caption text-product-danger-text" role="alert">
                              {errors[activeReview.id]}
                            </p>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={Boolean(pendingId)}
                            onClick={() => resolve(activeReview, "EXCLUDED")}
                          >
                            Exclude
                          </Button>
                          <Button
                            type="button"
                            disabled={Boolean(pendingId)}
                            onClick={() => resolve(activeReview, "APPROVED")}
                          >
                            {pendingId === activeReview.id ? "Saving…" : "Approve credit"}
                          </Button>
                        </div>
                      </>
                    ) : activeReview.resolution ? (
                      <div className="product-field border-t border-product-border-subtle pt-4">
                        <span className="text-micro font-bold tracking-widest text-product-text-secondary uppercase">
                          Decision note
                        </span>
                        <p className="m-0 text-sm leading-relaxed text-product-text-primary">
                          {activeReview.resolution}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}
            </SheetContent>
          </Sheet>
        </>
      )}
    </section>
  );
}

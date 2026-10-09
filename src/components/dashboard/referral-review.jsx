"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveReferralReview } from "@/app/actions/referral-review";
import { Button } from "@/components/product/button";

const reasonText = {
  same_browser: "Invitee and referrer used the same browser identifier. This can be legitimate; review before granting credit.",
};

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

export function ReferralReview({ waitListId, initialReviews, initialLoadError = false, canManage }) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [notes, setNotes] = useState({});
  const [errors, setErrors] = useState({});
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => setReviews(initialReviews), [initialReviews]);

  async function resolve(review, status) {
    setPendingId(review.id);
    setErrors((current) => ({ ...current, [review.id]: "" }));
    try {
      const response = await resolveReferralReview(waitListId, review.id, status, notes[review.id] || "");
      if (response.error) {
        setErrors((current) => ({ ...current, [review.id]: response.error }));
      } else {
        setReviews((current) => current.map((item) => item.id === review.id ? { ...item, reviewStatus: status, resolution: (notes[review.id] || "").trim(), reviewedAt: new Date().toISOString() } : item));
      }
    } catch {
      setErrors((current) => ({ ...current, [review.id]: "Could not save the decision. Try again." }));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section aria-labelledby="referral-review-title">
      <div className="product-page-heading">
        <h2 id="referral-review-title">Referral review</h2>
        <p className="product-description">Same-browser referrals wait for a decision before they affect position. Review the signal, then approve or exclude with a note.</p>
      </div>
      {initialLoadError ? (
        <div className="product-panel flex flex-wrap items-center justify-between gap-3 p-5" role="alert">
          <p className="font-medium">Referral reviews couldn’t be loaded.</p>
          <Button variant="outline" onClick={() => router.refresh()}>Try again</Button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="product-panel p-8 text-center"><p className="font-medium">No referrals need review</p><p className="product-help">Flagged referrals will appear here.</p></div>
      ) : (
        <div className="product-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-left">
              <thead className="bg-[var(--product-bg-inset)] text-[var(--product-text-secondary)]"><tr><th scope="col" className="px-4 py-3 font-medium">Invitee</th><th scope="col" className="px-4 py-3 font-medium">Referred by</th><th scope="col" className="px-4 py-3 font-medium">Review</th></tr></thead>
              <tbody>{reviews.map((review) => (
                <tr key={review.id} className="border-t border-[var(--product-border-subtle)] align-top">
                  <td className="px-4 py-4"><strong className="font-medium">{review.signUp.email}</strong><small className="mt-1 block text-[var(--product-text-secondary)]">Joined {formatDate(review.signUp.createdAt)}</small></td>
                  <td className="px-4 py-4">{review.referredBy?.email || "Referrer unavailable"}</td>
                  <td className="px-4 py-4">
                    <span className={`product-status ${review.reviewStatus === "APPROVED" ? "product-status-success" : ""}`}>
                      {review.reviewStatus === "NEEDS_REVIEW" ? "Needs review" : review.reviewStatus === "APPROVED" ? "Approved" : "Excluded"}
                    </span>
                    <p className="mt-2 max-w-lg text-sm text-[var(--product-text-secondary)]">{reasonText[review.reviewReason] || "This referral needs a manual eligibility decision."}</p>
                    {review.reviewStatus === "NEEDS_REVIEW" && canManage && <div className="mt-3 grid max-w-lg gap-2">
                      <label className="text-sm font-medium" htmlFor={`review-note-${review.id}`}>Decision note (required)</label>
                      <textarea className="product-review-note" id={`review-note-${review.id}`} aria-describedby={`review-note-hint-${review.id}`} minLength={8} maxLength={240} value={notes[review.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [review.id]: event.target.value }))} rows={2} placeholder="Explain why this referral is eligible or excluded" />
                      <p id={`review-note-hint-${review.id}`} className="product-help">Use 8–240 characters so the decision is clear later.</p>
                      {errors[review.id] && <p className="product-field-error" role="alert">{errors[review.id]}</p>}
                      <div className="referral-review-actions flex flex-wrap gap-2"><Button variant="outline" disabled={pendingId === review.id || (notes[review.id] || "").trim().length < 8} onClick={() => resolve(review, "APPROVED")}>{pendingId === review.id ? "Saving…" : "Approve credit"}</Button><Button variant="ghost" disabled={pendingId === review.id || (notes[review.id] || "").trim().length < 8} onClick={() => resolve(review, "EXCLUDED")}>Exclude</Button></div>
                    </div>}
                    {review.resolution && <p className="mt-3 text-sm">Decision note: {review.resolution}</p>}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {!canManage && <p className="border-t border-[var(--product-border-subtle)] px-4 py-3 text-sm text-[var(--product-text-secondary)]">An owner or admin can resolve referral reviews.</p>}
        </div>
      )}
    </section>
  );
}

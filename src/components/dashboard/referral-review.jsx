"use client";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import { formatProductDate } from "@/lib/product-date.mjs";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveReferralReview } from "@/app/actions/referral-review";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const reasonText = {
  same_browser: "Invitee and referrer used the same browser identifier. This can be legitimate; review before granting credit.",
};

function formatDate(date) {
  return formatProductDate(date);
}

export function ReferralReview({ waitListId, initialReviews, initialLoadError = false, canManage }) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [notes, setNotes] = useState({});
  const [errors, setErrors] = useState({});
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => setReviews(initialReviews), [initialReviews]);

  async function resolve(review, status) {
    if ((notes[review.id] || "").trim().length < 8) {
      setErrors((current) => ({ ...current, [review.id]: "Add a decision note of at least 8 characters." }));
      document.getElementById(`review-note-${review.id}`)?.focus();
      return;
    }
    setPendingId(review.id);
    setErrors((current) => ({ ...current, [review.id]: "" }));
    try {
      const response = await resolveReferralReview(waitListId, review.id, status, notes[review.id] || "");
      if (response.error) {
        setErrors((current) => ({ ...current, [review.id]: response.error }));
        toast.error(response.error);
      } else {
        toast.success(status === "APPROVED" ? "Referral approved." : "Referral excluded.");
        setReviews((current) => current.map((item) => item.id === review.id ? { ...item, reviewStatus: status, resolution: (notes[review.id] || "").trim(), reviewedAt: new Date().toISOString() } : item));
      }
    } catch {
      setErrors((current) => ({ ...current, [review.id]: "Could not save the decision. Try again." }));
      toast.error("Could not save the decision. Try again.");
    } finally {
      setPendingId(null);
    }
  }

  return <section className="product-referral-review" aria-labelledby="referral-review-title">
    <header><h2 id="referral-review-title">Referral review</h2><p className="product-description">Check flagged referrals before granting credit.</p></header>
    {initialLoadError ? <div className="product-referral-empty" role="alert"><p>Referral reviews couldn’t be loaded.</p><Button variant="outline" onClick={() => router.refresh()}>Try again</Button></div> : reviews.length === 0 ? <div className="product-referral-empty"><h3>No referrals need review</h3><p>Flagged referrals will appear here.</p></div> : <div className="product-referral-review-list">
      {reviews.map((review) => <article className="product-referral-review-item" key={review.id}>
        <header><h3>{review.signUp.email}</h3><span className={`product-status ${review.reviewStatus === "APPROVED" ? "product-status-success" : ""}`}>{review.reviewStatus === "NEEDS_REVIEW" ? "Needs review" : review.reviewStatus === "APPROVED" ? "Approved" : "Excluded"}</span></header>
        <dl><div><dt>Referred by</dt><dd>{review.referredBy?.email || "Referrer unavailable"}</dd></div><div><dt>Joined</dt><dd>{formatDate(review.signUp.createdAt)}</dd></div></dl>
        <p className="product-help">{reasonText[review.reviewReason] || "This referral needs a manual eligibility decision."}</p>
        {review.reviewStatus === "NEEDS_REVIEW" && canManage && <div className="product-referral-decision">
          <Label htmlFor={`review-note-${review.id}`}>Decision note</Label>
          <Textarea className="product-review-note" id={`review-note-${review.id}`} aria-invalid={Boolean(errors[review.id])} aria-describedby={`review-note-hint-${review.id}${errors[review.id] ? ` review-error-${review.id}` : ""}`} minLength={8} maxLength={240} value={notes[review.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [review.id]: event.target.value }))} rows={2} placeholder="Explain your decision" />
          <p id={`review-note-hint-${review.id}`} className="product-help">Use 8–240 characters.</p>
          {errors[review.id] && <p id={`review-error-${review.id}`} className="product-field-error" role="alert">{errors[review.id]}</p>}
          <div className="referral-review-actions"><Button variant="outline" disabled={Boolean(pendingId)} onClick={() => resolve(review, "APPROVED")}>{pendingId === review.id ? "Saving…" : "Approve credit"}</Button><Button variant="ghost" disabled={Boolean(pendingId)} onClick={() => resolve(review, "EXCLUDED")}>Exclude</Button></div>
        </div>}
        {review.resolution && <p className="product-referral-resolution">Decision note: {review.resolution}</p>}
      </article>)}
      {!canManage && <p className="product-help">An owner or admin can resolve referral reviews.</p>}
    </div>}
  </section>;
}

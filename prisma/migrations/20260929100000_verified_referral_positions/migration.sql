-- Support campaign-scoped deterministic position lookups without updating every
-- signup whenever a referral is accepted or verified.
CREATE INDEX "sign_ups_waitListId_createdAt_id_idx"
  ON "sign_ups"("waitListId", "createdAt", "id");

CREATE INDEX "referrals_referredById_idx"
  ON "referrals"("referredById");

-- Phase 4 stream B: fraud basics + custom points events (additive only).
-- Fraud posture per waitlist (STANDARD default; STRICT tightens velocity
-- caps and widens silent-mode coverage). Device digests backfill as null so
-- pre-capture rows simply skip fingerprint gates (fail-open).
ALTER TABLE "wait_lists" ADD COLUMN "fraudMode" TEXT NOT NULL DEFAULT 'STANDARD';

ALTER TABLE "sign_ups" ADD COLUMN "deviceFingerprint" TEXT;

-- CreateIndex
CREATE INDEX "sign_ups_deviceFingerprint_createdAt_idx" ON "sign_ups"("deviceFingerprint", "createdAt");

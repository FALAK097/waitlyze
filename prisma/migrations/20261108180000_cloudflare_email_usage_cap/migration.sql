CREATE TABLE "cloudflare_email_usage" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "messageId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cloudflare_email_usage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cloudflare_email_usage_idempotencyKey_key"
ON "cloudflare_email_usage"("idempotencyKey");

CREATE INDEX "cloudflare_email_usage_createdAt_idx"
ON "cloudflare_email_usage"("createdAt");

-- Retain the idempotency key with a blueprint reservation so the same handoff
-- can safely recover an orphan reservation after a failed draft creation.
ALTER TABLE "tool_blueprints" ADD COLUMN "claimedCreationKey" TEXT;

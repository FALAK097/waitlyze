-- Supports failed-verification lookups that correlate outbox_events on
-- payload.signUpId and take the latest event per signup.
CREATE INDEX "outbox_events_verification_signup_idx"
  ON "outbox_events" ("waitListId", "type", ("payload"->>'signUpId'), "createdAt" DESC, "id" DESC);

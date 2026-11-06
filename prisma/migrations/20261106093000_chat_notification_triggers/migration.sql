ALTER TABLE "waitlist_notification_channels" ADD COLUMN "triggers" TEXT[] NOT NULL DEFAULT ARRAY['MILESTONE_COUNTS']::TEXT[];

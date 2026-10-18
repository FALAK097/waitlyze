ALTER TABLE "email_templates" ADD COLUMN "editorDocument" JSONB;
ALTER TABLE "email_templates" ADD COLUMN "renderedHtml" TEXT;
ALTER TABLE "email_templates" ADD COLUMN "renderedText" TEXT;

ALTER TABLE "marketing_broadcasts" ADD COLUMN "editorDocument" JSONB;
ALTER TABLE "marketing_broadcasts" ADD COLUMN "renderedHtml" TEXT;
ALTER TABLE "marketing_broadcasts" ADD COLUMN "renderedText" TEXT;

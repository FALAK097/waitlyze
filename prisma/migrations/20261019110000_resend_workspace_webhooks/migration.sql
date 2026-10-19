ALTER TABLE "workspace_integrations" ADD COLUMN "webhookSecretCiphertext" TEXT;
ALTER TABLE "workspace_integrations" ADD COLUMN "webhookSecretIv" TEXT;
ALTER TABLE "workspace_integrations" ADD COLUMN "webhookSecretTag" TEXT;
ALTER TABLE "email_provider_events" ADD COLUMN "workspaceId" TEXT;

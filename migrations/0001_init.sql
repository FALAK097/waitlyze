-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "imageUrl" TEXT,
    "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "lastWorkspaceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "wait_lists" (
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publicSlug" TEXT,
    "templateSnapshot" JSONB,
    "templateRevision" INTEGER NOT NULL DEFAULT 1,
    "publishedRevision" INTEGER,
    "publishedTemplateRevision" INTEGER,
    "creationKey" TEXT,
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "websiteUrl" TEXT,
    "logoUrl" TEXT DEFAULT '/apple-icon.png',
    "logoKey" TEXT,
    "buttonColor" TEXT DEFAULT '#FF6B4A',
    "buttonBorder" TEXT DEFAULT '#FF9D7A',
    "buttonTextColor" TEXT DEFAULT '#FFFFFF',
    "mainBgColor" TEXT DEFAULT '#FFFFFF',
    "enableMainBgColor" BOOLEAN NOT NULL DEFAULT false,
    "bgColor" TEXT DEFAULT '#FFFFFF',
    "enableBgColor" BOOLEAN NOT NULL DEFAULT false,
    "borderWidth" TEXT DEFAULT '0px',
    "borderRadius" TEXT DEFAULT 'large',
    "fontWeight" TEXT DEFAULT 'normal',
    "logoSize" TEXT DEFAULT '1X',
    "buttonText" TEXT DEFAULT 'Join the waitlist',
    "successMessage" TEXT DEFAULT 'Success! You''re on the waitlist',
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "showSocialProof" BOOLEAN NOT NULL DEFAULT true,
    "showBadge" BOOLEAN NOT NULL DEFAULT true,
    "showBranding" BOOLEAN NOT NULL DEFAULT true,
    "showReferrals" BOOLEAN NOT NULL DEFAULT true,
    "badgeColor" TEXT DEFAULT '#FF9D7A',
    "badgeText" TEXT DEFAULT 'Sign Up to get early access',
    "badgeTextColor" TEXT DEFAULT '#FFFFFF',
    "inputColor" TEXT DEFAULT '#FFFFF',
    "inputBorder" TEXT DEFAULT '#E5E7EB',
    "inputTextColor" TEXT DEFAULT '#000000',
    "placeholderText" TEXT DEFAULT 'Enter your email',
    "twitterLink" TEXT,
    "facebookLink" TEXT,
    "instagramLink" TEXT,
    "linkedInLink" TEXT,
    "showSocialLinks" BOOLEAN NOT NULL DEFAULT true,
    "sendEmailsToSubscribers" BOOLEAN NOT NULL DEFAULT false,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "shareOnTwitter" BOOLEAN NOT NULL DEFAULT true,
    "shareOnWhatsapp" BOOLEAN NOT NULL DEFAULT true,
    "shareOnLinkedin" BOOLEAN NOT NULL DEFAULT true,
    "shareOnInstagram" BOOLEAN NOT NULL DEFAULT false,
    "shareOnFacebook" BOOLEAN NOT NULL DEFAULT false,
    "shareOnEmail" BOOLEAN NOT NULL DEFAULT false,
    "shareOnReddit" BOOLEAN NOT NULL DEFAULT false,
    "workspaceId" TEXT,
    "userId" TEXT NOT NULL,
    "fraudMode" TEXT NOT NULL DEFAULT 'STANDARD',
    CONSTRAINT "wait_lists_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "wait_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wait_list_revisions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "waitListId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wait_list_revisions_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wait_list_publication_revisions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "waitListId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "templateRevision" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wait_list_publication_revisions_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sign_ups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniqueUserId" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailNormalized" TEXT,
    "device" TEXT,
    "deviceType" TEXT,
    "city" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "ipAddress" TEXT,
    "latitude" TEXT,
    "longitude" TEXT,
    "referrer" TEXT,
    "landingPage" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "deviceFingerprint" TEXT,
    "phone" TEXT,
    "customFields" JSONB,
    "waitListId" TEXT NOT NULL,
    "impressionId" TEXT,
    "rank" INTEGER,
    "signUpEmailSent" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    "marketingConsentAt" DATETIME,
    "marketingUnsubscribedAt" DATETIME,
    "unsubscribeTokenHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sign_ups_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sign_ups_impressionId_fkey" FOREIGN KEY ("impressionId") REFERENCES "impressions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sign_up_verifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "signUpId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sign_up_verifications_signUpId_fkey" FOREIGN KEY ("signUpId") REFERENCES "sign_ups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    "lockedAt" DATETIME,
    "waitListId" TEXT,
    "providerMessageId" TEXT,
    "lastErrorCode" TEXT
);

-- CreateTable
CREATE TABLE "marketing_consent_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "waitListId" TEXT NOT NULL,
    "signUpId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "consentText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketing_consent_events_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "marketing_consent_events_signUpId_fkey" FOREIGN KEY ("signUpId") REFERENCES "sign_ups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marketing_broadcasts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "waitListId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "previewText" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "editorDocument" JSONB,
    "renderedHtml" TEXT,
    "renderedText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "segment" TEXT NOT NULL DEFAULT 'ALL',
    "scheduledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sentAt" DATETIME,
    CONSTRAINT "marketing_broadcasts_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "broadcast_recipients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "broadcastId" TEXT NOT NULL,
    "signUpId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "vars" JSONB,
    "providerMessageId" TEXT,
    "lastErrorCode" TEXT,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "broadcast_recipients_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "marketing_broadcasts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "broadcast_recipients_signUpId_fkey" FOREIGN KEY ("signUpId") REFERENCES "sign_ups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "automation_recipes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "waitListId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "automation_recipes_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "automation_recipe_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "automation_recipe_versions_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "automation_recipes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "automation_runs" (
    "recipeId" TEXT NOT NULL,
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeVersionId" TEXT NOT NULL,
    "waitListId" TEXT NOT NULL,
    "signUpId" TEXT NOT NULL,
    "triggerKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledAt" DATETIME NOT NULL,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "skipReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "automation_runs_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "automation_recipes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "automation_runs_recipeVersionId_fkey" FOREIGN KEY ("recipeVersionId") REFERENCES "automation_recipe_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "automation_runs_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "automation_runs_signUpId_fkey" FOREIGN KEY ("signUpId") REFERENCES "sign_ups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "automation_run_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "availableAt" DATETIME NOT NULL,
    "outboxEventKey" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "lastErrorCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    CONSTRAINT "automation_run_steps_runId_fkey" FOREIGN KEY ("runId") REFERENCES "automation_runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "impressions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniqueUserId" TEXT NOT NULL,
    "device" TEXT,
    "deviceType" TEXT,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "ipAddress" TEXT,
    "latitude" TEXT,
    "longitude" TEXT,
    "referrer" TEXT,
    "landingPage" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "waitListId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "impressions_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "share_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "waitListId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "share_events_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "signUpId" TEXT NOT NULL,
    "referredById" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'CLEAR',
    "reviewReason" TEXT,
    "resolution" TEXT,
    "reviewedAt" DATETIME,
    "reviewedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "referrals_signUpId_fkey" FOREIGN KEY ("signUpId") REFERENCES "sign_ups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "referrals_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "sign_ups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "point_ledger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "waitListId" TEXT NOT NULL,
    "signUpId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "eventKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "launch_rehearsal_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "waitListId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checksPassed" INTEGER NOT NULL,
    "checksFailed" INTEGER NOT NULL,
    "checkResults" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "launch_rehearsal_runs_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyId" TEXT,
    "scopes" TEXT NOT NULL DEFAULT '["waitlist:write"]',
    "expiresAt" DATETIME,
    "lastUsedAt" DATETIME,
    "revokedAt" DATETIME,
    "userId" TEXT NOT NULL,
    "waitlistId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "api_keys_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "wait_lists" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "waitListId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "previewText" TEXT NOT NULL,
    "header" TEXT NOT NULL,
    "subHeader" TEXT NOT NULL,
    "mainBody" TEXT NOT NULL,
    "editorDocument" JSONB,
    "renderedHtml" TEXT,
    "renderedText" TEXT,
    "subBody" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "email_templates_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "webhook_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "waitListId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "eventTypes" TEXT NOT NULL DEFAULT '["signup.created"]',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "includeSubscriberData" BOOLEAN NOT NULL DEFAULT false,
    "secretCiphertext" TEXT NOT NULL,
    "secretIv" TEXT NOT NULL,
    "secretTag" TEXT NOT NULL,
    "previousSecretCiphertext" TEXT,
    "previousSecretIv" TEXT,
    "previousSecretTag" TEXT,
    "previousSecretValidUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastDeliveredAt" DATETIME,
    CONSTRAINT "webhook_subscriptions_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "replayCount" INTEGER NOT NULL DEFAULT 0,
    "availableAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" DATETIME,
    "processedAt" DATETIME,
    "deliveredAt" DATETIME,
    "responseStatus" INTEGER,
    "lastErrorCode" TEXT,
    CONSTRAINT "webhook_deliveries_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "webhook_subscriptions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" DATETIME,
    "refreshTokenExpiresAt" DATETIME,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "jwks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicKey" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "expiresAt" DATETIME,
    "alg" TEXT,
    "crv" TEXT
);

-- CreateTable
CREATE TABLE "oauthClient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT,
    "clientDiscoveryId" TEXT,
    "disabled" BOOLEAN DEFAULT false,
    "skipConsent" BOOLEAN,
    "enableEndSession" BOOLEAN,
    "subjectType" TEXT,
    "scopes" TEXT,
    "clientCredentialsScopes" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME,
    "updatedAt" DATETIME,
    "name" TEXT,
    "uri" TEXT,
    "icon" TEXT,
    "contacts" TEXT,
    "tos" TEXT,
    "policy" TEXT,
    "softwareId" TEXT,
    "softwareVersion" TEXT,
    "softwareStatement" TEXT,
    "redirectUris" TEXT NOT NULL,
    "postLogoutRedirectUris" TEXT,
    "backchannelLogoutUri" TEXT,
    "backchannelLogoutSessionRequired" BOOLEAN,
    "tokenEndpointAuthMethod" TEXT,
    "applicationType" TEXT,
    "jwks" TEXT,
    "jwksUri" TEXT,
    "grantTypes" TEXT NOT NULL,
    "responseTypes" TEXT NOT NULL,
    "requirePKCE" BOOLEAN,
    "dpopBoundAccessTokens" BOOLEAN DEFAULT false,
    "referenceId" TEXT,
    "metadata" JSONB,
    CONSTRAINT "oauthClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "oauthResource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accessTokenTtl" INTEGER,
    "refreshTokenTtl" INTEGER,
    "signingAlgorithm" TEXT,
    "signingKeyId" TEXT,
    "allowedScopes" TEXT,
    "customClaims" JSONB,
    "dpopBoundAccessTokensRequired" BOOLEAN DEFAULT false,
    "disabled" BOOLEAN DEFAULT false,
    "createdAt" DATETIME,
    "updatedAt" DATETIME,
    "policyVersion" INTEGER DEFAULT 1,
    "metadata" JSONB
);

-- CreateTable
CREATE TABLE "oauthClientResource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME,
    CONSTRAINT "oauthClientResource_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauthClient" ("clientId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "oauthClientResource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "oauthResource" ("identifier") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "oauthRefreshToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT NOT NULL,
    "referenceId" TEXT,
    "authorizationCodeId" TEXT,
    "resources" TEXT,
    "requestedUserInfoClaims" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME,
    "revoked" DATETIME,
    "rotatedAt" DATETIME,
    "rotationReplayResponse" TEXT,
    "rotationReplayExpiresAt" DATETIME,
    "authTime" DATETIME,
    "confirmation" JSONB,
    "scopes" TEXT,
    CONSTRAINT "oauthRefreshToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauthClient" ("clientId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "oauthRefreshToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "oauthRefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "oauthAccessToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT,
    "clientId" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "referenceId" TEXT,
    "authorizationCodeId" TEXT,
    "resources" TEXT,
    "requestedUserInfoClaims" TEXT,
    "refreshId" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME,
    "revoked" DATETIME,
    "confirmation" JSONB,
    "scopes" TEXT,
    CONSTRAINT "oauthAccessToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauthClient" ("clientId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "oauthAccessToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "oauthAccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "oauthAccessToken_refreshId_fkey" FOREIGN KEY ("refreshId") REFERENCES "oauthRefreshToken" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "oauthConsent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "userId" TEXT,
    "referenceId" TEXT,
    "resources" TEXT,
    "requestedUserInfoClaims" TEXT,
    "scopes" TEXT,
    "createdAt" DATETIME,
    "updatedAt" DATETIME,
    CONSTRAINT "oauthConsent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauthClient" ("clientId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "oauthConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "oauthClientAssertion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "personalOwnerId" TEXT,
    "signupUsageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workspaces_personalOwnerId_fkey" FOREIGN KEY ("personalOwnerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workspace_audit_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "resourceName" TEXT,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workspace_audit_events_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workspace_audit_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("workspaceId", "userId"),
    CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workspace_subscriptions" (
    "workspaceId" TEXT NOT NULL PRIMARY KEY,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'FREE',
    "interval" TEXT,
    "dodoCustomerId" TEXT,
    "dodoSubscriptionId" TEXT,
    "dodoProductId" TEXT,
    "checkoutIntentId" TEXT,
    "checkoutInterval" TEXT,
    "checkoutUrl" TEXT,
    "checkoutSessionId" TEXT,
    "checkoutUrlExpiresAt" DATETIME,
    "checkoutCreationStartedAt" DATETIME,
    "checkoutPendingUntil" DATETIME,
    "currentPeriodStart" DATETIME,
    "currentPeriodEnd" DATETIME,
    "pastDueEndsAt" DATETIME,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "lastEventAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workspace_subscriptions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dodo_webhook_receipts" (
    "webhookId" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "workspaceId" TEXT,
    "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "workspace_invitations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "tokenHash" TEXT NOT NULL,
    "tokenCiphertext" TEXT NOT NULL,
    "tokenIv" TEXT NOT NULL,
    "tokenTag" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" DATETIME NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "acceptedByUserId" TEXT,
    "acceptedAt" DATETIME,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workspace_invitations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workspace_invitations_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workspace_invitations_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_provider_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerEventId" TEXT NOT NULL,
    "providerMessageId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "type" TEXT NOT NULL,
    "isPermanent" BOOLEAN NOT NULL DEFAULT false,
    "recipientEmails" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "email_suppressions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_suppressions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workspace_integrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEEDS_TEST',
    "secretCiphertext" TEXT NOT NULL,
    "secretIv" TEXT NOT NULL,
    "secretTag" TEXT NOT NULL,
    "webhookSecretCiphertext" TEXT,
    "webhookSecretIv" TEXT,
    "webhookSecretTag" TEXT,
    "fromEmail" TEXT NOT NULL,
    "providerConfig" JSONB,
    "lastTestedAt" DATETIME,
    "lastErrorCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workspace_integrations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "waitlist_email_senders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "waitListId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEEDS_TEST',
    "secretCiphertext" TEXT NOT NULL,
    "secretIv" TEXT NOT NULL,
    "secretTag" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "lastTestedAt" DATETIME,
    "lastErrorCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "waitlist_email_senders_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "waitlist_notification_channels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "waitListId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEEDS_TEST',
    "triggers" TEXT NOT NULL DEFAULT '["MILESTONE_COUNTS"]',
    "secretCiphertext" TEXT NOT NULL,
    "secretIv" TEXT NOT NULL,
    "secretTag" TEXT NOT NULL,
    "lastTestedAt" DATETIME,
    "lastErrorCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "waitlist_notification_channels_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "custom_domains" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostname" TEXT NOT NULL,
    "providerId" TEXT,
    "workspaceId" TEXT NOT NULL,
    "waitListId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEEDS_DNS',
    "verification" JSONB,
    "dnsRecords" JSONB,
    "lastCheckedAt" DATETIME,
    "lastErrorCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "custom_domains_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "custom_domains_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rate_limit_buckets" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "cloudflare_email_usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idempotencyKey" TEXT NOT NULL,
    "messageId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_id_key" ON "users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wait_lists_publicSlug_key" ON "wait_lists"("publicSlug");

-- CreateIndex
CREATE UNIQUE INDEX "wait_lists_id_key" ON "wait_lists"("id");

-- CreateIndex
CREATE INDEX "wait_lists_workspaceId_status_idx" ON "wait_lists"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "wait_lists_workspaceId_id_idx" ON "wait_lists"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "wait_lists_userId_workspaceId_idx" ON "wait_lists"("userId", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "wait_lists_workspaceId_creationKey_key" ON "wait_lists"("workspaceId", "creationKey");

-- CreateIndex
CREATE INDEX "wait_list_revisions_waitListId_createdAt_idx" ON "wait_list_revisions"("waitListId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "wait_list_revisions_waitListId_revision_key" ON "wait_list_revisions"("waitListId", "revision");

-- CreateIndex
CREATE INDEX "wait_list_publication_revisions_waitListId_createdAt_idx" ON "wait_list_publication_revisions"("waitListId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "wait_list_publication_revisions_waitListId_revision_key" ON "wait_list_publication_revisions"("waitListId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "sign_ups_referralCode_key" ON "sign_ups"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "sign_ups_unsubscribeTokenHash_key" ON "sign_ups"("unsubscribeTokenHash");

-- CreateIndex
CREATE INDEX "sign_ups_waitListId_uniqueUserId_idx" ON "sign_ups"("waitListId", "uniqueUserId");

-- CreateIndex
CREATE INDEX "sign_ups_waitListId_createdAt_id_idx" ON "sign_ups"("waitListId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "sign_ups_ipAddress_createdAt_idx" ON "sign_ups"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "sign_ups_deviceFingerprint_createdAt_idx" ON "sign_ups"("deviceFingerprint", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sign_ups_waitListId_emailNormalized_key" ON "sign_ups"("waitListId", "emailNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "sign_up_verifications_signUpId_key" ON "sign_up_verifications"("signUpId");

-- CreateIndex
CREATE UNIQUE INDEX "sign_up_verifications_tokenHash_key" ON "sign_up_verifications"("tokenHash");

-- CreateIndex
CREATE INDEX "sign_up_verifications_expiresAt_idx" ON "sign_up_verifications"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_eventKey_key" ON "outbox_events"("eventKey");

-- CreateIndex
CREATE INDEX "outbox_events_status_availableAt_idx" ON "outbox_events"("status", "availableAt");

-- CreateIndex
CREATE INDEX "outbox_events_status_lockedAt_idx" ON "outbox_events"("status", "lockedAt");

-- CreateIndex
CREATE INDEX "marketing_consent_events_signUpId_createdAt_idx" ON "marketing_consent_events"("signUpId", "createdAt");

-- CreateIndex
CREATE INDEX "marketing_consent_events_waitListId_createdAt_idx" ON "marketing_consent_events"("waitListId", "createdAt");

-- CreateIndex
CREATE INDEX "marketing_broadcasts_waitListId_updatedAt_id_idx" ON "marketing_broadcasts"("waitListId", "updatedAt", "id");

-- CreateIndex
CREATE INDEX "broadcast_recipients_broadcastId_status_idx" ON "broadcast_recipients"("broadcastId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "broadcast_recipients_broadcastId_signUpId_key" ON "broadcast_recipients"("broadcastId", "signUpId");

-- CreateIndex
CREATE INDEX "automation_recipes_waitListId_status_idx" ON "automation_recipes"("waitListId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "automation_recipes_waitListId_type_key" ON "automation_recipes"("waitListId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "automation_recipe_versions_recipeId_version_key" ON "automation_recipe_versions"("recipeId", "version");

-- CreateIndex
CREATE INDEX "automation_runs_waitListId_createdAt_idx" ON "automation_runs"("waitListId", "createdAt");

-- CreateIndex
CREATE INDEX "automation_runs_status_scheduledAt_idx" ON "automation_runs"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "automation_runs_recipeId_triggerKey_key" ON "automation_runs"("recipeId", "triggerKey");

-- CreateIndex
CREATE UNIQUE INDEX "automation_run_steps_outboxEventKey_key" ON "automation_run_steps"("outboxEventKey");

-- CreateIndex
CREATE INDEX "automation_run_steps_runId_position_idx" ON "automation_run_steps"("runId", "position");

-- CreateIndex
CREATE INDEX "automation_run_steps_status_availableAt_idx" ON "automation_run_steps"("status", "availableAt");

-- CreateIndex
CREATE UNIQUE INDEX "automation_run_steps_runId_stepKey_key" ON "automation_run_steps"("runId", "stepKey");

-- CreateIndex
CREATE INDEX "impressions_waitListId_createdAt_idx" ON "impressions"("waitListId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "impressions_waitListId_uniqueUserId_key" ON "impressions"("waitListId", "uniqueUserId");

-- CreateIndex
CREATE INDEX "share_events_waitListId_createdAt_idx" ON "share_events"("waitListId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_signUpId_key" ON "referrals"("signUpId");

-- CreateIndex
CREATE INDEX "referrals_referredById_reviewStatus_idx" ON "referrals"("referredById", "reviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "point_ledger_eventKey_key" ON "point_ledger"("eventKey");

-- CreateIndex
CREATE INDEX "point_ledger_waitListId_signUpId_idx" ON "point_ledger"("waitListId", "signUpId");

-- CreateIndex
CREATE INDEX "launch_rehearsal_runs_waitListId_createdAt_idx" ON "launch_rehearsal_runs"("waitListId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyId_key" ON "api_keys"("keyId");

-- CreateIndex
CREATE INDEX "api_keys_waitlistId_revokedAt_idx" ON "api_keys"("waitlistId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_waitListId_type_key" ON "email_templates"("waitListId", "type");

-- CreateIndex
CREATE INDEX "webhook_subscriptions_waitListId_enabled_idx" ON "webhook_subscriptions"("waitListId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_deliveries_eventKey_key" ON "webhook_deliveries"("eventKey");

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_availableAt_idx" ON "webhook_deliveries"("status", "availableAt");

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_lockedAt_idx" ON "webhook_deliveries"("status", "lockedAt");

-- CreateIndex
CREATE INDEX "webhook_deliveries_subscriptionId_createdAt_idx" ON "webhook_deliveries"("subscriptionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "oauthClient_clientId_key" ON "oauthClient"("clientId");

-- CreateIndex
CREATE INDEX "oauthClient_userId_idx" ON "oauthClient"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "oauthResource_identifier_key" ON "oauthResource"("identifier");

-- CreateIndex
CREATE INDEX "oauthClientResource_clientId_idx" ON "oauthClientResource"("clientId");

-- CreateIndex
CREATE INDEX "oauthClientResource_resourceId_idx" ON "oauthClientResource"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "oauthRefreshToken_token_key" ON "oauthRefreshToken"("token");

-- CreateIndex
CREATE INDEX "oauthRefreshToken_clientId_idx" ON "oauthRefreshToken"("clientId");

-- CreateIndex
CREATE INDEX "oauthRefreshToken_sessionId_idx" ON "oauthRefreshToken"("sessionId");

-- CreateIndex
CREATE INDEX "oauthRefreshToken_userId_idx" ON "oauthRefreshToken"("userId");

-- CreateIndex
CREATE INDEX "oauthRefreshToken_authorizationCodeId_idx" ON "oauthRefreshToken"("authorizationCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "oauthAccessToken_token_key" ON "oauthAccessToken"("token");

-- CreateIndex
CREATE INDEX "oauthAccessToken_clientId_idx" ON "oauthAccessToken"("clientId");

-- CreateIndex
CREATE INDEX "oauthAccessToken_sessionId_idx" ON "oauthAccessToken"("sessionId");

-- CreateIndex
CREATE INDEX "oauthAccessToken_userId_idx" ON "oauthAccessToken"("userId");

-- CreateIndex
CREATE INDEX "oauthAccessToken_authorizationCodeId_idx" ON "oauthAccessToken"("authorizationCodeId");

-- CreateIndex
CREATE INDEX "oauthAccessToken_refreshId_idx" ON "oauthAccessToken"("refreshId");

-- CreateIndex
CREATE INDEX "oauthConsent_clientId_idx" ON "oauthConsent"("clientId");

-- CreateIndex
CREATE INDEX "oauthConsent_userId_idx" ON "oauthConsent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_personalOwnerId_key" ON "workspaces"("personalOwnerId");

-- CreateIndex
CREATE INDEX "workspace_audit_events_workspaceId_createdAt_idx" ON "workspace_audit_events"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "workspace_members_userId_workspaceId_idx" ON "workspace_members"("userId", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_subscriptions_dodoSubscriptionId_key" ON "workspace_subscriptions"("dodoSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_subscriptions_checkoutIntentId_key" ON "workspace_subscriptions"("checkoutIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_subscriptions_checkoutSessionId_key" ON "workspace_subscriptions"("checkoutSessionId");

-- CreateIndex
CREATE INDEX "workspace_subscriptions_status_currentPeriodEnd_idx" ON "workspace_subscriptions"("status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "workspace_subscriptions_dodoCustomerId_idx" ON "workspace_subscriptions"("dodoCustomerId");

-- CreateIndex
CREATE INDEX "dodo_webhook_receipts_workspaceId_processedAt_idx" ON "dodo_webhook_receipts"("workspaceId", "processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_invitations_tokenHash_key" ON "workspace_invitations"("tokenHash");

-- CreateIndex
CREATE INDEX "workspace_invitations_workspaceId_status_createdAt_idx" ON "workspace_invitations"("workspaceId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_provider_events_providerEventId_key" ON "email_provider_events"("providerEventId");

-- CreateIndex
CREATE INDEX "email_provider_events_providerMessageId_type_idx" ON "email_provider_events"("providerMessageId", "type");

-- CreateIndex
CREATE INDEX "email_suppressions_workspaceId_createdAt_idx" ON "email_suppressions"("workspaceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_suppressions_workspaceId_emailNormalized_key" ON "email_suppressions"("workspaceId", "emailNormalized");

-- CreateIndex
CREATE INDEX "workspace_integrations_workspaceId_status_idx" ON "workspace_integrations"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_integrations_workspaceId_provider_key" ON "workspace_integrations"("workspaceId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_email_senders_waitListId_key" ON "waitlist_email_senders"("waitListId");

-- CreateIndex
CREATE INDEX "waitlist_notification_channels_waitListId_status_idx" ON "waitlist_notification_channels"("waitListId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_notification_channels_waitListId_provider_key" ON "waitlist_notification_channels"("waitListId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "custom_domains_hostname_key" ON "custom_domains"("hostname");

-- CreateIndex
CREATE UNIQUE INDEX "custom_domains_providerId_key" ON "custom_domains"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_domains_waitListId_key" ON "custom_domains"("waitListId");

-- CreateIndex
CREATE INDEX "custom_domains_workspaceId_status_idx" ON "custom_domains"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "rate_limit_buckets_expiresAt_idx" ON "rate_limit_buckets"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "cloudflare_email_usage_idempotencyKey_key" ON "cloudflare_email_usage"("idempotencyKey");

-- CreateIndex
CREATE INDEX "cloudflare_email_usage_createdAt_idx" ON "cloudflare_email_usage"("createdAt");


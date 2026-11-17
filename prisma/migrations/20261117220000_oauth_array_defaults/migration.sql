-- AlterTable
ALTER TABLE "oauthClient" ALTER COLUMN "scopes" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "contacts" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "redirectUris" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "postLogoutRedirectUris" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "grantTypes" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "responseTypes" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "oauthResource" ALTER COLUMN "allowedScopes" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "oauthRefreshToken" ALTER COLUMN "resources" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "requestedUserInfoClaims" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "scopes" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "oauthAccessToken" ALTER COLUMN "resources" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "requestedUserInfoClaims" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "scopes" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "oauthConsent" ALTER COLUMN "resources" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "requestedUserInfoClaims" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "scopes" SET DEFAULT ARRAY[]::TEXT[];

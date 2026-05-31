-- CreateEnum
CREATE TYPE "EmailTemplateType" AS ENUM ('SIGNUP', 'OFFBOARDING');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wait_lists" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "websiteUrl" TEXT,
    "logoUrl" TEXT DEFAULT '/images/logo.png',
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
    "userId" TEXT NOT NULL,

    CONSTRAINT "wait_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sign_ups" (
    "id" TEXT NOT NULL,
    "uniqueUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "device" TEXT,
    "deviceType" TEXT,
    "city" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "ipAddress" TEXT,
    "latitude" TEXT,
    "longitude" TEXT,
    "waitListId" TEXT NOT NULL,
    "impressionId" TEXT,
    "rank" INTEGER,
    "signUpEmailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sign_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impressions" (
    "id" TEXT NOT NULL,
    "uniqueUserId" TEXT NOT NULL,
    "device" TEXT,
    "deviceType" TEXT,
    "city" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "ipAddress" TEXT,
    "latitude" TEXT,
    "longitude" TEXT,
    "waitListId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "impressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "signUpId" TEXT NOT NULL,
    "referredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "waitlistId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "waitListId" TEXT NOT NULL,
    "type" "EmailTemplateType" NOT NULL,
    "subject" TEXT NOT NULL,
    "previewText" TEXT NOT NULL,
    "header" TEXT NOT NULL,
    "subHeader" TEXT NOT NULL,
    "mainBody" TEXT NOT NULL,
    "subBody" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_id_key" ON "users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wait_lists_id_key" ON "wait_lists"("id");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_signUpId_key" ON "referrals"("signUpId");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_waitListId_type_key" ON "email_templates"("waitListId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- AddForeignKey
ALTER TABLE "wait_lists" ADD CONSTRAINT "wait_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_ups" ADD CONSTRAINT "sign_ups_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_ups" ADD CONSTRAINT "sign_ups_impressionId_fkey" FOREIGN KEY ("impressionId") REFERENCES "impressions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impressions" ADD CONSTRAINT "impressions_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_signUpId_fkey" FOREIGN KEY ("signUpId") REFERENCES "sign_ups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "sign_ups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "wait_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

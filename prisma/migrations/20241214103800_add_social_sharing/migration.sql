-- AlterTable
ALTER TABLE "wait_lists" ADD COLUMN     "ogDescription" TEXT,
ADD COLUMN     "ogImage" TEXT,
ADD COLUMN     "ogTitle" TEXT,
ADD COLUMN     "shareOnEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shareOnFacebook" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shareOnInstagram" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shareOnLinkedin" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shareOnReddit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shareOnTwitter" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shareOnWhatsapp" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "successMessage" SET DEFAULT 'Success! You''re on the waitlist';

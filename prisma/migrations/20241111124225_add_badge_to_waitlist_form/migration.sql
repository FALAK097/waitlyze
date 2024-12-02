-- AlterTable
ALTER TABLE "wait_lists" ADD COLUMN     "badgeColor" TEXT DEFAULT '#8B5CF6',
ADD COLUMN     "badgeText" TEXT DEFAULT 'Sign Up to get early access',
ADD COLUMN     "badgeTextColor" TEXT DEFAULT '#FFFFFF',
ADD COLUMN     "showBadge" BOOLEAN NOT NULL DEFAULT true;

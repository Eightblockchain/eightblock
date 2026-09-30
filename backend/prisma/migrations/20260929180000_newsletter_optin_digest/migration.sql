-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PENDING' BEFORE 'ACTIVE';

-- CreateEnum
CREATE TYPE "CampaignKind" AS ENUM ('MANUAL', 'ARTICLE', 'DIGEST');

-- AlterTable
ALTER TABLE "Subscription"
  ADD COLUMN "confirmToken" TEXT,
  ADD COLUMN "confirmSentAt" TIMESTAMP(3),
  ADD COLUMN "unsubscribeReason" TEXT;

-- Everyone who left before reasons were recorded left through an unsubscribe link.
UPDATE "Subscription" SET "unsubscribeReason" = 'unsubscribed' WHERE "status" = 'UNSUBSCRIBED';

-- AlterTable
ALTER TABLE "NewsletterCampaign"
  ADD COLUMN "kind" "CampaignKind" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "sourceKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_confirmToken_key" ON "Subscription"("confirmToken");

-- CreateIndex
CREATE INDEX "Subscription_status_confirmSentAt_idx" ON "Subscription"("status", "confirmSentAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterCampaign_sourceKey_key" ON "NewsletterCampaign"("sourceKey");

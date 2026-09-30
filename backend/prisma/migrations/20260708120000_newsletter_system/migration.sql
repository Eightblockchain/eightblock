-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Subscription" ADD COLUMN "unsubscribeToken" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "confirmedAt" TIMESTAMP(3);

UPDATE "Subscription"
SET "unsubscribeToken" = md5(random()::text || clock_timestamp()::text || id)
WHERE "unsubscribeToken" IS NULL;

ALTER TABLE "Subscription" ALTER COLUMN "unsubscribeToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_unsubscribeToken_key" ON "Subscription"("unsubscribeToken");

-- CreateTable
CREATE TABLE "NewsletterCampaign" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('WALLET_CARDANO', 'GOOGLE', 'GITHUB');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'READER';

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "authorName" TEXT,
ADD COLUMN     "visitorId" TEXT,
ALTER COLUMN "authorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Like" ADD COLUMN     "visitorId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "walletAddress" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AuthIdentity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id")
);

-- Backfill identities for existing wallet users
INSERT INTO "AuthIdentity" ("id", "userId", "provider", "providerId")
SELECT md5(random()::text || clock_timestamp()::text || "id"), "id", 'WALLET_CARDANO', "walletAddress"
FROM "User"
WHERE "walletAddress" IS NOT NULL;

-- CreateIndex
CREATE INDEX "AuthIdentity_userId_idx" ON "AuthIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthIdentity_provider_providerId_key" ON "AuthIdentity"("provider", "providerId");

-- CreateIndex
CREATE INDEX "Comment_visitorId_idx" ON "Comment"("visitorId");

-- CreateIndex
CREATE INDEX "Like_articleId_visitorId_idx" ON "Like"("articleId", "visitorId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_articleId_visitorId_key" ON "Like"("articleId", "visitorId");

-- AddForeignKey
ALTER TABLE "AuthIdentity" ADD CONSTRAINT "AuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

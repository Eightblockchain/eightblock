-- These objects were previously created with `prisma db push` only, so databases built from
-- migrations were missing them. IF NOT EXISTS keeps this a no-op where they already exist.

-- AlterTable
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "score" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Article_status_score_idx" ON "Article"("status", "score");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Comment_articleId_createdAt_idx" ON "Comment"("articleId", "createdAt");

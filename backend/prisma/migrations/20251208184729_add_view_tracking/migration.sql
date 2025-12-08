-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "uniqueViews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ArticleView" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT,
    "visitorId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "country" TEXT,
    "city" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeOnPage" INTEGER,
    "scrollDepth" INTEGER,

    CONSTRAINT "ArticleView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArticleView_articleId_idx" ON "ArticleView"("articleId");

-- CreateIndex
CREATE INDEX "ArticleView_visitorId_idx" ON "ArticleView"("visitorId");

-- CreateIndex
CREATE INDEX "ArticleView_viewedAt_idx" ON "ArticleView"("viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleView_articleId_visitorId_viewedAt_key" ON "ArticleView"("articleId", "visitorId", "viewedAt");

-- CreateIndex
CREATE INDEX "Article_viewCount_idx" ON "Article"("viewCount");

-- CreateIndex
CREATE INDEX "Article_uniqueViews_idx" ON "Article"("uniqueViews");

-- AddForeignKey
ALTER TABLE "ArticleView" ADD CONSTRAINT "ArticleView_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

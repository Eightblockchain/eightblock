-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleCategory" (
    "articleId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ArticleCategory_pkey" PRIMARY KEY ("articleId","categoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "ArticleCategory_categoryId_idx" ON "ArticleCategory"("categoryId");

-- AddForeignKey
ALTER TABLE "ArticleCategory" ADD CONSTRAINT "ArticleCategory_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleCategory" ADD CONSTRAINT "ArticleCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Category" ("id", "name", "slug", "description", "position", "updatedAt") VALUES
    ('cardano', 'Cardano', 'cardano', NULL, 0, CURRENT_TIMESTAMP),
    ('midnight', 'Midnight', 'midnight', NULL, 1, CURRENT_TIMESTAMP),
    ('safrochain', 'Safrochain', 'safrochain', NULL, 2, CURRENT_TIMESTAMP);

-- The old category column held either a copy of the first tag or a label such as "Tutorial".
-- Labels that are not already tags on the article become tags, so no topic is lost.
CREATE TEMP TABLE "LegacyCategory" AS
SELECT "id" AS "articleId",
       trim("category") AS "name",
       trim(BOTH '-' FROM regexp_replace(lower("category"), '[^a-z0-9]+', '-', 'g')) AS "slug"
FROM "Article";

DELETE FROM "LegacyCategory" WHERE "slug" IN ('', 'general');

INSERT INTO "Tag" ("id", "name", "slug")
SELECT md5(random()::text || clock_timestamp()::text || l."slug"), min(l."name"), l."slug"
FROM "LegacyCategory" l
WHERE NOT EXISTS (SELECT 1 FROM "Tag" t WHERE t."slug" = l."slug")
GROUP BY l."slug"
ON CONFLICT DO NOTHING;

INSERT INTO "TagOnArticle" ("articleId", "tagId")
SELECT l."articleId", t."id"
FROM "LegacyCategory" l
JOIN "Tag" t ON t."slug" = l."slug"
ON CONFLICT DO NOTHING;

DROP TABLE "LegacyCategory";

-- AlterTable
ALTER TABLE "Article" DROP COLUMN "category";

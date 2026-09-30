-- Article view counts now come from "PageView" alone. The old article tracker ("ArticleView")
-- was copied into "PageView" when site analytics started, so its history is already there.

-- The old tracker could record one visit twice when two requests raced; those copies arrive
-- within two seconds of each other for the same visitor and page.
DELETE FROM "PageView" p
USING (
    SELECT
        "id",
        "createdAt" - lag("createdAt") OVER (
            PARTITION BY "visitorId", "path" ORDER BY "createdAt", "id"
        ) AS gap
    FROM "PageView"
) d
WHERE p."id" = d."id" AND d.gap < interval '2 seconds';

-- Recount with the live rules: once per reader per 30 minutes, never the author's own views.
WITH reads AS (
    SELECT
        p."articleId",
        p."visitorId",
        p."createdAt" - lag(p."createdAt") OVER (
            PARTITION BY p."articleId", p."visitorId" ORDER BY p."createdAt"
        ) AS gap
    FROM "PageView" p
    JOIN "Article" a ON a."id" = p."articleId"
    WHERE p."userId" IS DISTINCT FROM a."authorId"
),
totals AS (
    SELECT
        "articleId",
        count(*) FILTER (WHERE gap IS NULL OR gap >= interval '30 minutes')::int AS views,
        count(DISTINCT "visitorId")::int AS readers
    FROM reads
    GROUP BY 1
)
UPDATE "Article" a
SET "viewCount" = COALESCE(t.views, 0),
    "uniqueViews" = COALESCE(t.readers, 0)
FROM "Article" a2
LEFT JOIN totals t ON t."articleId" = a2."id"
WHERE a."id" = a2."id";

DROP TABLE "ArticleView";

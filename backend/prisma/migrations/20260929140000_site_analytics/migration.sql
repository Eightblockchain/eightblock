-- Newsletter churn needs to know when someone left.
ALTER TABLE "Subscription" ADD COLUMN "unsubscribedAt" TIMESTAMP(3);
CREATE INDEX "Subscription_createdAt_idx" ON "Subscription"("createdAt");
CREATE INDEX "Subscription_unsubscribedAt_idx" ON "Subscription"("unsubscribedAt");

-- Site-wide page views for the analytics dashboard.
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "path" TEXT NOT NULL,
    "articleId" TEXT,
    "isEntry" BOOLEAN NOT NULL DEFAULT false,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "country" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "scrollDepth" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PageView_createdAt_idx" ON "PageView"("createdAt");
CREATE INDEX "PageView_visitorId_createdAt_idx" ON "PageView"("visitorId", "createdAt");
CREATE INDEX "PageView_sessionId_idx" ON "PageView"("sessionId");
CREATE INDEX "PageView_articleId_createdAt_idx" ON "PageView"("articleId", "createdAt");
CREATE INDEX "PageView_lastSeenAt_idx" ON "PageView"("lastSeenAt");

ALTER TABLE "PageView" ADD CONSTRAINT "PageView_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Carry over the article reads recorded so far, so the dashboard starts with history.
-- Sessions are rebuilt the same way new traffic is split: a gap of 30 minutes starts a new one.
WITH ordered AS (
    SELECT
        v.*,
        a."slug",
        CASE
            WHEN lag(v."viewedAt") OVER w IS NULL
              OR v."viewedAt" - lag(v."viewedAt") OVER w > interval '30 minutes'
            THEN 1 ELSE 0
        END AS starts_session,
        lower(substring(v."referrer" from '^https?://(?:www\.)?([^/:?#]+)')) AS ref_host
    FROM "ArticleView" v
    JOIN "Article" a ON a."id" = v."articleId"
    WINDOW w AS (PARTITION BY v."visitorId" ORDER BY v."viewedAt")
),
numbered AS (
    SELECT
        *,
        sum(starts_session) OVER (
            PARTITION BY "visitorId" ORDER BY "viewedAt" ROWS UNBOUNDED PRECEDING
        ) AS session_no
    FROM ordered
)
INSERT INTO "PageView" (
    "id", "visitorId", "sessionId", "userId", "path", "articleId", "isEntry", "referrer",
    "device", "browser", "os", "duration", "scrollDepth", "createdAt", "lastSeenAt"
)
SELECT
    "id",
    "visitorId",
    md5("visitorId" || ':' || session_no),
    "userId",
    '/articles/' || "slug",
    "articleId",
    starts_session = 1,
    CASE
        WHEN starts_session = 1
         AND ref_host IS NOT NULL
         AND ref_host NOT IN ('localhost', '127.0.0.1')
         AND ref_host NOT LIKE '%eightblock.dev'
        THEN ref_host
    END,
    CASE WHEN "device" IN ('desktop', 'mobile', 'tablet') THEN "device" WHEN "device" IS NULL THEN NULL ELSE 'other' END,
    "browser",
    "os",
    LEAST(GREATEST(COALESCE("timeOnPage", 0), 0), 1800),
    "scrollDepth",
    "viewedAt",
    "viewedAt" + make_interval(secs => LEAST(GREATEST(COALESCE("timeOnPage", 0), 0), 1800))
FROM numbered;

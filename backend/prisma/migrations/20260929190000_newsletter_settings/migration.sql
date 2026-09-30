-- CreateTable
CREATE TABLE "NewsletterSettings" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "fromAddress" TEXT,
    "transactionalFrom" TEXT,
    "replyTo" TEXT,
    "postalAddress" TEXT,
    "doubleOptIn" BOOLEAN NOT NULL DEFAULT true,
    "confirmExpiryDays" INTEGER NOT NULL DEFAULT 7,
    "welcomeEmail" BOOLEAN NOT NULL DEFAULT true,
    "accountWelcome" BOOLEAN NOT NULL DEFAULT true,
    "articleDrafts" BOOLEAN NOT NULL DEFAULT true,
    "digestEnabled" BOOLEAN NOT NULL DEFAULT true,
    "digestDay" INTEGER NOT NULL DEFAULT 1,
    "digestHour" INTEGER NOT NULL DEFAULT 9,
    "digestTimezone" TEXT NOT NULL DEFAULT 'UTC',
    "digestMaxArticles" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSettings_pkey" PRIMARY KEY ("id")
);

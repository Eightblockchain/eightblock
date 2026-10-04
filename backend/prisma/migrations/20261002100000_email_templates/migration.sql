-- CreateTable
CREATE TABLE "EmailTemplate" (
    "key" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "preheader" TEXT,
    "eyebrow" TEXT,
    "heading" TEXT,
    "body" TEXT,
    "buttonLabel" TEXT,
    "note" TEXT,
    "articlesLabel" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("key")
);

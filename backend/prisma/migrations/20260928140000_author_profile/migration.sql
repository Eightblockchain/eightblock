-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleAvatarUrl" TEXT;

-- CreateTable
CREATE TABLE "AuthorProfile" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "intro" TEXT,
    "story" TEXT,
    "location" TEXT,
    "focusAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "projects" JSONB NOT NULL DEFAULT '[]',
    "links" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthorProfile_userId_key" ON "AuthorProfile"("userId");

-- AddForeignKey
ALTER TABLE "AuthorProfile" ADD CONSTRAINT "AuthorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

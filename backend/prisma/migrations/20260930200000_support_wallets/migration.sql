-- CreateTable
CREATE TABLE "SupportWallet" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "label" TEXT,
    "note" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportWallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportWallet_enabled_position_idx" ON "SupportWallet"("enabled", "position");

-- The address the blog used to hard-code, so the support box stays up after the upgrade.
INSERT INTO "SupportWallet" ("id", "network", "currency", "address", "label", "note", "position", "updatedAt")
VALUES (
    'cardano-ada',
    'Cardano',
    'ADA',
    'addr1qy7w8dvq0fddt7yefqeeju420f9sdq57xgrezvvdz9dwe620pqsxeefd6xxanuht9dupwph0l3lr3r73x80m0tlxp9gquyz5en',
    'Support with ADA',
    'On-chain tips via smart contract coming soon.',
    0,
    CURRENT_TIMESTAMP
);

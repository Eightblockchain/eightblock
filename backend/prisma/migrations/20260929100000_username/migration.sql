-- AlterTable
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Backfill: slug of the name (or email local part), 3 to 24 characters.
-- Duplicates and too-short handles get a piece of the user id, so every handle is unique.
WITH base AS (
  SELECT
    id,
    regexp_replace(
      left(
        trim(BOTH '-' FROM regexp_replace(lower(COALESCE(NULLIF(name, ''), split_part(email, '@', 1), '')), '[^a-z0-9]+', '-', 'g')),
        24
      ),
      '-+$', ''
    ) AS handle,
    "createdAt"
  FROM "User"
),
ranked AS (
  SELECT id, handle, row_number() OVER (PARTITION BY handle ORDER BY "createdAt", id) AS n
  FROM base
)
UPDATE "User" u
SET username = CASE
  WHEN length(r.handle) >= 3 AND r.n = 1 THEN r.handle
  WHEN length(r.handle) >= 1 THEN r.handle || '-' || left(replace(u.id, '-', ''), 6)
  ELSE 'writer-' || left(replace(u.id, '-', ''), 6)
END
FROM ranked r
WHERE u.id = r.id;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

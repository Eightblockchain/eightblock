-- New accounts (Google sign-in) default to readers; admins are promoted via ADMIN_EMAILS.
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'READER';

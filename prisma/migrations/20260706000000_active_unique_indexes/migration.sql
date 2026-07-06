-- Allow soft-deleted rows to keep their old values while active rows stay unique.
DROP INDEX IF EXISTS "Category_name_key";
DROP INDEX IF EXISTS "User_email_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_active_key"
ON "Category"("name")
WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_active_key"
ON "User"("email")
WHERE "deletedAt" IS NULL;

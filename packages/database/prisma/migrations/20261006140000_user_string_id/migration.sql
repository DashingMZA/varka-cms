-- Revert User.id from Int back to String (cuid).
-- Better Auth 1.7.x has no native integer-ID runtime support; the Prisma
-- $extends string->int shim is removed in favour of native String IDs.
-- Existing numeric values are preserved as text ("1", "2", ...); new rows
-- get cuid() defaults from the Prisma schema.

-- Drop foreign key constraints first
ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_userId_fkey";
ALTER TABLE "twoFactor" DROP CONSTRAINT IF EXISTS "twoFactor_userId_fkey";
ALTER TABLE "UserRole" DROP CONSTRAINT IF EXISTS "UserRole_userId_fkey";
ALTER TABLE "AuthorProfile" DROP CONSTRAINT IF EXISTS "AuthorProfile_userId_fkey";
ALTER TABLE "Post" DROP CONSTRAINT IF EXISTS "Post_authorId_fkey";
ALTER TABLE "Page" DROP CONSTRAINT IF EXISTS "Page_authorId_fkey";
ALTER TABLE "Revision" DROP CONSTRAINT IF EXISTS "Revision_authorId_fkey";
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "Comment_authorUserId_fkey";
ALTER TABLE "MediaAsset" DROP CONSTRAINT IF EXISTS "MediaAsset_uploadedById_fkey";

-- Convert columns Int -> Text (values preserved as "1", "2", ...)
ALTER TABLE "User" ALTER COLUMN "id" TYPE TEXT USING "id"::TEXT;
ALTER TABLE "Session" ALTER COLUMN "userId" TYPE TEXT USING "userId"::TEXT;
ALTER TABLE "Account" ALTER COLUMN "userId" TYPE TEXT USING "userId"::TEXT;
ALTER TABLE "twoFactor" ALTER COLUMN "userId" TYPE TEXT USING "userId"::TEXT;
ALTER TABLE "UserRole" ALTER COLUMN "userId" TYPE TEXT USING "userId"::TEXT;
ALTER TABLE "AuthorProfile" ALTER COLUMN "userId" TYPE TEXT USING "userId"::TEXT;
ALTER TABLE "Post" ALTER COLUMN "authorId" TYPE TEXT USING "authorId"::TEXT;
ALTER TABLE "Page" ALTER COLUMN "authorId" TYPE TEXT USING "authorId"::TEXT;
ALTER TABLE "Revision" ALTER COLUMN "authorId" TYPE TEXT USING "authorId"::TEXT;
ALTER TABLE "Comment" ALTER COLUMN "authorUserId" TYPE TEXT USING "authorUserId"::TEXT;
ALTER TABLE "MediaAsset" ALTER COLUMN "uploadedById" TYPE TEXT USING "uploadedById"::TEXT;

-- Drop the integer sequence default left from autoincrement()
ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;

-- Re-create foreign key constraints
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthorProfile" ADD CONSTRAINT "AuthorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Page" ADD CONSTRAINT "Page_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

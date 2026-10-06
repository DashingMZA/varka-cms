-- Migrate User.id from String (cuid) to Int (autoincrement) for WordPress-style numeric user IDs.
-- Also converts all foreign keys referencing User.id.
-- Existing users get sequential IDs (1, 2, 3...) ordered by creation time.

-- Step 1: Build old-CUID -> new-Int mapping (ordered by creation, oldest = 1)
CREATE TABLE "_user_id_map" (
  "old_id" TEXT PRIMARY KEY,
  "new_id" SERIAL
);
INSERT INTO "_user_id_map" ("old_id")
SELECT "id" FROM "User" ORDER BY "createdAt" ASC;

-- Step 2: Add new integer columns
ALTER TABLE "User" ADD COLUMN "id_new" INTEGER;
ALTER TABLE "Session" ADD COLUMN "userId_new" INTEGER;
ALTER TABLE "Account" ADD COLUMN "userId_new" INTEGER;
ALTER TABLE "twoFactor" ADD COLUMN "userId_new" INTEGER;
ALTER TABLE "UserRole" ADD COLUMN "userId_new" INTEGER;
ALTER TABLE "AuthorProfile" ADD COLUMN "userId_new" INTEGER;
ALTER TABLE "Post" ADD COLUMN "authorId_new" INTEGER;
ALTER TABLE "Page" ADD COLUMN "authorId_new" INTEGER;
ALTER TABLE "Revision" ADD COLUMN "authorId_new" INTEGER;
ALTER TABLE "Comment" ADD COLUMN "authorUserId_new" INTEGER;
ALTER TABLE "MediaAsset" ADD COLUMN "uploadedById_new" INTEGER;

-- Step 3: Populate new columns via mapping
UPDATE "User" u SET "id_new" = m."new_id" FROM "_user_id_map" m WHERE u."id" = m."old_id";
UPDATE "Session" s SET "userId_new" = m."new_id" FROM "_user_id_map" m WHERE s."userId" = m."old_id";
UPDATE "Account" a SET "userId_new" = m."new_id" FROM "_user_id_map" m WHERE a."userId" = m."old_id";
UPDATE "twoFactor" t SET "userId_new" = m."new_id" FROM "_user_id_map" m WHERE t."userId" = m."old_id";
UPDATE "UserRole" ur SET "userId_new" = m."new_id" FROM "_user_id_map" m WHERE ur."userId" = m."old_id";
UPDATE "AuthorProfile" ap SET "userId_new" = m."new_id" FROM "_user_id_map" m WHERE ap."userId" = m."old_id";
UPDATE "Post" p SET "authorId_new" = m."new_id" FROM "_user_id_map" m WHERE p."authorId" = m."old_id";
UPDATE "Page" p SET "authorId_new" = m."new_id" FROM "_user_id_map" m WHERE p."authorId" = m."old_id";
UPDATE "Revision" r SET "authorId_new" = m."new_id" FROM "_user_id_map" m WHERE r."authorId" = m."old_id";
UPDATE "Comment" c SET "authorUserId_new" = m."new_id" FROM "_user_id_map" m WHERE c."authorUserId" = m."old_id";
UPDATE "MediaAsset" ma SET "uploadedById_new" = m."new_id" FROM "_user_id_map" m WHERE ma."uploadedById" = m."old_id";

-- Enforce NOT NULL where the schema requires it
ALTER TABLE "User" ALTER COLUMN "id_new" SET NOT NULL;
ALTER TABLE "Session" ALTER COLUMN "userId_new" SET NOT NULL;
ALTER TABLE "Account" ALTER COLUMN "userId_new" SET NOT NULL;
ALTER TABLE "twoFactor" ALTER COLUMN "userId_new" SET NOT NULL;
ALTER TABLE "UserRole" ALTER COLUMN "userId_new" SET NOT NULL;
ALTER TABLE "AuthorProfile" ALTER COLUMN "userId_new" SET NOT NULL;

-- Step 4: Drop foreign key constraints referencing old String IDs
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";
ALTER TABLE "twoFactor" DROP CONSTRAINT "twoFactor_userId_fkey";
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_userId_fkey";
ALTER TABLE "AuthorProfile" DROP CONSTRAINT "AuthorProfile_userId_fkey";
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";
ALTER TABLE "Page" DROP CONSTRAINT "Page_authorId_fkey";
ALTER TABLE "Revision" DROP CONSTRAINT "Revision_authorId_fkey";
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_authorUserId_fkey";
ALTER TABLE "MediaAsset" DROP CONSTRAINT "MediaAsset_uploadedById_fkey";

-- Step 5: Swap columns on User (drop old PK, rename new)
ALTER TABLE "User" DROP CONSTRAINT "User_pkey";
ALTER TABLE "User" DROP COLUMN "id";
ALTER TABLE "User" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "User" ADD PRIMARY KEY ("id");

-- Step 6: Swap columns on referencing tables
ALTER TABLE "Session" DROP COLUMN "userId";
ALTER TABLE "Session" RENAME COLUMN "userId_new" TO "userId";
ALTER TABLE "Account" DROP COLUMN "userId";
ALTER TABLE "Account" RENAME COLUMN "userId_new" TO "userId";
ALTER TABLE "twoFactor" DROP COLUMN "userId";
ALTER TABLE "twoFactor" RENAME COLUMN "userId_new" TO "userId";
ALTER TABLE "UserRole" DROP COLUMN "userId";
ALTER TABLE "UserRole" RENAME COLUMN "userId_new" TO "userId";
ALTER TABLE "AuthorProfile" DROP COLUMN "userId";
ALTER TABLE "AuthorProfile" RENAME COLUMN "userId_new" TO "userId";
ALTER TABLE "Post" DROP COLUMN "authorId";
ALTER TABLE "Post" RENAME COLUMN "authorId_new" TO "authorId";
ALTER TABLE "Page" DROP COLUMN "authorId";
ALTER TABLE "Page" RENAME COLUMN "authorId_new" TO "authorId";
ALTER TABLE "Revision" DROP COLUMN "authorId";
ALTER TABLE "Revision" RENAME COLUMN "authorId_new" TO "authorId";
ALTER TABLE "Comment" DROP COLUMN "authorUserId";
ALTER TABLE "Comment" RENAME COLUMN "authorUserId_new" TO "authorUserId";
ALTER TABLE "MediaAsset" DROP COLUMN "uploadedById";
ALTER TABLE "MediaAsset" RENAME COLUMN "uploadedById_new" TO "uploadedById";

-- Step 7: Recreate foreign key constraints
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

-- Step 8: Create sequence for autoincrement and set default
CREATE SEQUENCE "User_id_seq";
SELECT setval('"User_id_seq"', COALESCE((SELECT MAX("id") FROM "User"), 0) + 1, false);
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT nextval('"User_id_seq"');
ALTER SEQUENCE "User_id_seq" OWNED BY "User"."id";

-- Step 9: Cleanup
DROP TABLE "_user_id_map";

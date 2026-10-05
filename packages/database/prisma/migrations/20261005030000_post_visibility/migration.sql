-- Add visibility and password protection to Post (WordPress-style)
ALTER TABLE "Post" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE "Post" ADD COLUMN "password" TEXT;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "featuredImageId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Post_featuredImageId_idx" ON "Post"("featuredImageId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Post_featuredImageId_fkey'
  ) THEN
    ALTER TABLE "Post"
      ADD CONSTRAINT "Post_featuredImageId_fkey"
      FOREIGN KEY ("featuredImageId") REFERENCES "MediaAsset"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

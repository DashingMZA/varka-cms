-- AlterTable MediaAsset: caption, keywords; original preserved via key + sizes JSON
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "caption" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "keywords" TEXT;

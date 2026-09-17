-- Media security + WP-style metadata / derivative sizes
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "caption" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "keywords" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "sizes" JSONB;

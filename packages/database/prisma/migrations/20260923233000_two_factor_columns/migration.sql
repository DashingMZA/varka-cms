-- Better Auth twoFactor extra columns
ALTER TABLE "twoFactor" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "twoFactor" ADD COLUMN IF NOT EXISTS "failedVerificationCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "twoFactor" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

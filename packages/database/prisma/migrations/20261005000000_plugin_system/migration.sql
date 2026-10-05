-- Plugin system: installed WordPress-style plugins
CREATE TABLE IF NOT EXISTS "Plugin" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "description" TEXT,
  "author" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "manifest" JSONB,
  "installedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Plugin_active_idx" ON "Plugin"("active");

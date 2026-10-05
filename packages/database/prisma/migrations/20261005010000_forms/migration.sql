-- Forms module (Contact Form 7 parity): forms + entries
CREATE TABLE IF NOT EXISTS "Form" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT,
  "fields" JSONB NOT NULL DEFAULT '[]',
  "submitLabel" TEXT NOT NULL DEFAULT 'Send',
  "successMessage" TEXT NOT NULL DEFAULT 'Thank you! Your message has been sent.',
  "mailTo" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Form_active_idx" ON "Form"("active");

CREATE TABLE IF NOT EXISTS "FormEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "formId" TEXT NOT NULL REFERENCES "Form"("id") ON DELETE CASCADE,
  "data" JSONB NOT NULL DEFAULT '{}',
  "ip" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "FormEntry_formId_createdAt_idx" ON "FormEntry"("formId", "createdAt");

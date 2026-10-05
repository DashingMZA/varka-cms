-- Create Redirection table
CREATE TABLE "Redirection" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "code" INTEGER NOT NULL DEFAULT 301,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Redirection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Redirection_siteId_source_key" ON "Redirection"("siteId", "source");
CREATE INDEX "Redirection_siteId_active_idx" ON "Redirection"("siteId", "active");

ALTER TABLE "Redirection" ADD CONSTRAINT "Redirection_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

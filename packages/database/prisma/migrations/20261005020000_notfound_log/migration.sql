-- Create NotFoundLog table for 404 monitor
CREATE TABLE "NotFoundLog" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "userAgent" TEXT,
    "hits" INTEGER NOT NULL DEFAULT 1,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotFoundLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotFoundLog_siteId_path_key" ON "NotFoundLog"("siteId", "path");
CREATE INDEX "NotFoundLog_siteId_lastSeen_idx" ON "NotFoundLog"("siteId", "lastSeen");

ALTER TABLE "NotFoundLog" ADD CONSTRAINT "NotFoundLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

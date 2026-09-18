ALTER TABLE "Website" ADD COLUMN "schemaVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Website" ADD COLUMN "currentDocument" JSONB;

CREATE TABLE "WebsiteVersion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "websiteId" TEXT NOT NULL REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "version" INTEGER NOT NULL,
  "document" JSONB NOT NULL,
  "source" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebsiteVersion_websiteId_version_key" UNIQUE ("websiteId", "version")
);
CREATE INDEX "WebsiteVersion_websiteId_createdAt_idx" ON "WebsiteVersion"("websiteId", "createdAt");

CREATE TABLE "WebsiteAsset" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "websiteId" TEXT NOT NULL REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "provider" TEXT NOT NULL,
  "providerId" TEXT,
  "url" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "WebsiteAsset_websiteId_purpose_idx" ON "WebsiteAsset"("websiteId", "purpose");

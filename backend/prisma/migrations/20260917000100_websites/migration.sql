ALTER TYPE "CrmStage" ADD VALUE 'SITE_GENERATED';
CREATE TABLE "Website" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "crmLeadId" TEXT NOT NULL UNIQUE REFERENCES "CrmLead"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "business" JSONB NOT NULL,
  "theme" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "generationStatus" TEXT NOT NULL DEFAULT 'pending',
  "generationError" TEXT,
  "revision" INTEGER NOT NULL DEFAULT 0,
  "published" JSONB,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "WebsiteSection" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "websiteId" TEXT NOT NULL REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "type" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "visible" BOOLEAN NOT NULL DEFAULT true,
  "content" JSONB NOT NULL,
  "settings" JSONB NOT NULL
);
CREATE INDEX "WebsiteSection_websiteId_order_idx" ON "WebsiteSection"("websiteId", "order");

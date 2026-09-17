-- CreateEnum
CREATE TYPE "CrmStage" AS ENUM ('NEW', 'MESSAGE_SENT', 'REPLIED', 'INTERESTED', 'NEGOTIATION', 'CLIENT', 'LOST');

-- CreateEnum
CREATE TYPE "CrmActivityType" AS ENUM ('ADDED_TO_CRM', 'MESSAGE_SENT', 'STAGE_CHANGED', 'NOTE_ADDED', 'FOLLOW_UP_CREATED', 'WHATSAPP_OPENED', 'CLIENT_WON', 'LOST');

-- CreateTable
CREATE TABLE "CrmLead" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "stage" "CrmStage" NOT NULL DEFAULT 'NEW',
    "position" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "lastContactAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmActivity" (
    "id" TEXT NOT NULL,
    "crmLeadId" TEXT NOT NULL,
    "type" "CrmActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrmLead_leadId_key" ON "CrmLead"("leadId");

-- CreateIndex
CREATE INDEX "CrmLead_stage_position_idx" ON "CrmLead"("stage", "position");

-- CreateIndex
CREATE INDEX "CrmActivity_crmLeadId_createdAt_idx" ON "CrmActivity"("crmLeadId", "createdAt");

-- AddForeignKey
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_crmLeadId_fkey" FOREIGN KEY ("crmLeadId") REFERENCES "CrmLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

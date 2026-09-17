-- CreateEnum
CREATE TYPE "Status" AS ENUM ('NOVO', 'CONTATADO', 'RESPONDEU', 'INTERESSADO', 'NEGOCIACAO', 'CLIENTE', 'IGNORADO');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('PROSPECCAO', 'ENRIQUECIMENTO');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "googlePlaceId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "nicho" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "telefone" TEXT,
    "telefoneInternacional" TEXT,
    "site" TEXT,
    "googleMapsUrl" TEXT,
    "nota" DOUBLE PRECISION,
    "quantidadeAvaliacoes" INTEGER,
    "businessStatus" TEXT,
    "status" "Status" NOT NULL DEFAULT 'NOVO',
    "observacoes" TEXT,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "source" "LeadSource" NOT NULL DEFAULT 'PROSPECCAO',
    "lastEnrichedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nicho" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "quantidadeSolicitada" INTEGER NOT NULL,
    "quantidadeEncontrada" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignLead" (
    "leadId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,

    CONSTRAINT "CampaignLead_pkey" PRIMARY KEY ("leadId","campaignId")
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "servico" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_googlePlaceId_key" ON "Lead"("googlePlaceId");

-- CreateIndex
CREATE INDEX "CampaignLead_campaignId_idx" ON "CampaignLead"("campaignId");

-- AddForeignKey
ALTER TABLE "CampaignLead" ADD CONSTRAINT "CampaignLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignLead" ADD CONSTRAINT "CampaignLead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

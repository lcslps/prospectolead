ALTER TABLE "Website"
  ADD COLUMN "generationStage" TEXT NOT NULL DEFAULT 'IDLE',
  ADD COLUMN "generationRetries" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "generationStartedAt" TIMESTAMP(3),
  ADD COLUMN "generationNextAttemptAt" TIMESTAMP(3);

CREATE INDEX "Website_generationStatus_generationNextAttemptAt_idx"
  ON "Website"("generationStatus", "generationNextAttemptAt");

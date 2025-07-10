-- Migration for Group Consent Participant functionality
-- This migration adds support for tracking individual participant consents in groups
-- It creates the necessary tables, enums, and relationships for the consent flow
-- The GroupMessagesService has been updated to remove fallback poll functionality

-- CreateEnum
CREATE TYPE "GroupConsentStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "ConsentResponseType" AS ENUM ('pending', 'accepted', 'rejected');

-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "consent_completed_at" TIMESTAMPTZ(6),
ADD COLUMN     "consent_poll_id" TEXT,
ADD COLUMN     "consent_requested_at" TIMESTAMPTZ(6),
ADD COLUMN     "consent_status" "GroupConsentStatus" NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE "participant_consents" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "participant_id" UUID NOT NULL,
    "consent_status" "ConsentResponseType" NOT NULL DEFAULT 'pending',
    "responded_at" TIMESTAMPTZ(6),

    CONSTRAINT "participant_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "participant_consents_group_id_idx" ON "participant_consents"("group_id");

-- CreateIndex
CREATE INDEX "participant_consents_participant_id_idx" ON "participant_consents"("participant_id");

-- CreateIndex
CREATE INDEX "participant_consents_consent_status_idx" ON "participant_consents"("consent_status");

-- CreateIndex
CREATE UNIQUE INDEX "participant_consents_group_id_participant_id_key" ON "participant_consents"("group_id", "participant_id");

-- AddForeignKey
ALTER TABLE "participant_consents" ADD CONSTRAINT "participant_consents_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_consents" ADD CONSTRAINT "participant_consents_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

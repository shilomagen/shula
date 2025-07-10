/*
  Warnings:

  - The `status` column on the `groups` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `relationship` column on the `participant_persons` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `participants` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `persons` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `processing_status` column on the `photos` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('active', 'inactive', 'deleted');

-- CreateEnum
CREATE TYPE "PhotoProcessingStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('active', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('onboarding', 'support', 'personRegistration', 'general');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('incoming', 'outgoing');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('sent', 'delivered', 'read', 'failed');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('image', 'audio', 'video', 'document');

-- CreateEnum
CREATE TYPE "MediaDistributionStatus" AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- CreateEnum
CREATE TYPE "ParticipantPersonRelationship" AS ENUM ('parent', 'guardian', 'relative', 'other');

-- AlterTable
ALTER TABLE "groups" DROP COLUMN "status",
ADD COLUMN     "status" "EntityStatus" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "participant_persons" DROP COLUMN "relationship",
ADD COLUMN     "relationship" "ParticipantPersonRelationship";

-- AlterTable
ALTER TABLE "participants" DROP COLUMN "status",
ADD COLUMN     "status" "EntityStatus" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "persons" DROP COLUMN "status",
ADD COLUMN     "status" "EntityStatus" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "photos" DROP COLUMN "processing_status",
ADD COLUMN     "processing_status" "PhotoProcessingStatus" NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "participant_id" UUID NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'active',
    "conversation_type" "ConversationType" NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "content" TEXT NOT NULL,
    "media_url" TEXT,
    "media_type" "MediaType",
    "sent_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MessageStatus" NOT NULL DEFAULT 'sent',
    "metadata" JSONB,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_distributions" (
    "id" UUID NOT NULL,
    "photo_id" UUID NOT NULL,
    "participant_id" UUID NOT NULL,
    "sent_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MediaDistributionStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "media_distributions_pkey" PRIMARY KEY ("photo_id","participant_id")
);

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_distributions" ADD CONSTRAINT "media_distributions_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_distributions" ADD CONSTRAINT "media_distributions_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `participant_id` on the `persons` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "persons" DROP CONSTRAINT "persons_participant_id_fkey";

-- AlterTable
ALTER TABLE "persons" DROP COLUMN "participant_id";

-- CreateTable
CREATE TABLE "participant_persons" (
    "participant_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "relationship" TEXT,
    "is_creator" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participant_persons_pkey" PRIMARY KEY ("participant_id","person_id")
);

-- AddForeignKey
ALTER TABLE "participant_persons" ADD CONSTRAINT "participant_persons_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_persons" ADD CONSTRAINT "participant_persons_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

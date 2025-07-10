/*
  Warnings:

  - The `relationship` column on the `participant_persons` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "participant_persons" DROP COLUMN "relationship",
ADD COLUMN     "relationship" TEXT;

-- DropEnum
DROP TYPE "ParticipantPersonRelationship";

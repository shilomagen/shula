/*
  Warnings:

  - You are about to drop the column `person_id` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the `group_persons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `participant_persons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `photo_persons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `photos` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `group_id` to the `persons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `participant_id` to the `persons` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "group_persons" DROP CONSTRAINT "group_persons_group_id_fkey";

-- DropForeignKey
ALTER TABLE "group_persons" DROP CONSTRAINT "group_persons_person_id_fkey";

-- DropForeignKey
ALTER TABLE "media_distributions" DROP CONSTRAINT "media_distributions_photo_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_person_id_fkey";

-- DropForeignKey
ALTER TABLE "participant_persons" DROP CONSTRAINT "participant_persons_participant_id_fkey";

-- DropForeignKey
ALTER TABLE "participant_persons" DROP CONSTRAINT "participant_persons_person_id_fkey";

-- DropForeignKey
ALTER TABLE "photo_persons" DROP CONSTRAINT "photo_persons_person_id_fkey";

-- DropForeignKey
ALTER TABLE "photo_persons" DROP CONSTRAINT "photo_persons_photo_id_fkey";

-- DropForeignKey
ALTER TABLE "photos" DROP CONSTRAINT "photos_source_group_id_fkey";

-- DropForeignKey
ALTER TABLE "photos" DROP CONSTRAINT "photos_uploaded_by_fkey";

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "person_id";

-- AlterTable
ALTER TABLE "persons" ADD COLUMN     "group_id" UUID NOT NULL,
ADD COLUMN     "participant_id" UUID NOT NULL;

-- DropTable
DROP TABLE "group_persons";

-- DropTable
DROP TABLE "participant_persons";

-- DropTable
DROP TABLE "photo_persons";

-- DropTable
DROP TABLE "photos";

-- DropEnum
DROP TYPE "MediaStatus";

-- DropEnum
DROP TYPE "MediaType";

-- CreateIndex
CREATE INDEX "persons_participant_id_idx" ON "persons"("participant_id");

-- CreateIndex
CREATE INDEX "persons_group_id_idx" ON "persons"("group_id");

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

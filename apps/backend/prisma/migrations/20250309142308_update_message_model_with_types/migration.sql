/*
  Warnings:

  - You are about to drop the column `direction` on the `messages` table. All the data in the column will be lost.
  - Added the required column `type` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('USER_MESSAGE', 'AGENT_MESSAGE', 'IMAGE_UPLOAD', 'PERSON_CREATED', 'PERSON_CONNECTED', 'SYSTEM_EVENT');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'DELETED');

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "direction",
ADD COLUMN     "person_id" UUID,
ADD COLUMN     "type" "MessageType" NOT NULL,
ALTER COLUMN "content" DROP NOT NULL;

-- DropEnum
DROP TYPE "MessageDirection";

-- CreateTable
CREATE TABLE "message_photos" (
    "message_id" UUID NOT NULL,
    "photo_id" UUID NOT NULL,
    "status" "MediaStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "message_photos_pkey" PRIMARY KEY ("message_id","photo_id")
);

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_photos" ADD CONSTRAINT "message_photos_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_photos" ADD CONSTRAINT "message_photos_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `photo_ids` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the `message_photos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "message_photos" DROP CONSTRAINT "message_photos_message_id_fkey";

-- DropForeignKey
ALTER TABLE "message_photos" DROP CONSTRAINT "message_photos_photo_id_fkey";

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "photo_ids",
ADD COLUMN     "photo_id" TEXT;

-- DropTable
DROP TABLE "message_photos";

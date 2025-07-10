/*
  Warnings:

  - You are about to drop the column `media_type` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `media_url` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `sent_at` on the `messages` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "messages" DROP COLUMN "media_type",
DROP COLUMN "media_url",
DROP COLUMN "sent_at",
ADD COLUMN     "photo_ids" UUID[] DEFAULT ARRAY[]::UUID[],
ADD COLUMN     "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "status" SET DEFAULT 'delivered';

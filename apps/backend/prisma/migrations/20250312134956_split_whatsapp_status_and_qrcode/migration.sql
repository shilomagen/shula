/*
  Warnings:

  - You are about to drop the column `qr_code` on the `whatsapp_status` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "whatsapp_status" DROP COLUMN "qr_code";

-- CreateTable
CREATE TABLE "whatsapp_qrcode" (
    "id" TEXT NOT NULL DEFAULT 'current',
    "qr_code" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "whatsapp_qrcode_pkey" PRIMARY KEY ("id")
);

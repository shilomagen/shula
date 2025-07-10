-- CreateEnum
CREATE TYPE "PendingMessageType" AS ENUM ('GROUP_ADDED_DISABLED');

-- CreateEnum
CREATE TYPE "PendingMessageStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "pending_group_messages" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "whatsapp_group_id" TEXT NOT NULL,
    "message_type" "PendingMessageType" NOT NULL,
    "group_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ(6),
    "status" "PendingMessageStatus" NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pending_group_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pending_group_messages_whatsapp_group_id_idx" ON "pending_group_messages"("whatsapp_group_id");

-- CreateIndex
CREATE INDEX "pending_group_messages_status_idx" ON "pending_group_messages"("status");

-- AddForeignKey
ALTER TABLE "pending_group_messages" ADD CONSTRAINT "pending_group_messages_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

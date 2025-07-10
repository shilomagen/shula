/*
  Warnings:

  - Changed the type of `type` on the `messages` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ConversationMessageType" AS ENUM ('USER_MESSAGE', 'AGENT_MESSAGE', 'IMAGE_UPLOAD', 'PERSON_CREATED', 'PERSON_CONNECTED', 'SYSTEM_EVENT');

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "type",
ADD COLUMN     "type" "ConversationMessageType" NOT NULL;

-- DropEnum
DROP TYPE "MessageType";

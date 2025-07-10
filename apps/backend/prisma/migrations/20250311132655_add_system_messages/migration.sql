-- CreateTable
CREATE TABLE "system_messages" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "system_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_messages_key_key" ON "system_messages"("key");

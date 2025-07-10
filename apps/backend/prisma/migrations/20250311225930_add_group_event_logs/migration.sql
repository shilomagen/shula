-- CreateTable
CREATE TABLE "group_event_logs" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "media_type" TEXT,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "group_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_event_logs_group_id_idx" ON "group_event_logs"("group_id");

-- CreateIndex
CREATE INDEX "group_event_logs_event_type_idx" ON "group_event_logs"("event_type");

-- CreateIndex
CREATE INDEX "group_event_logs_media_type_idx" ON "group_event_logs"("media_type");

-- CreateIndex
CREATE INDEX "group_event_logs_timestamp_idx" ON "group_event_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "group_event_logs" ADD CONSTRAINT "group_event_logs_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

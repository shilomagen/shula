-- CreateIndex
CREATE INDEX "conversation_status_idx" ON "conversations"("status");

-- CreateIndex
CREATE INDEX "conversation_last_message_at_idx" ON "conversations"("last_message_at");

-- CreateIndex
CREATE INDEX "conversation_type_status_idx" ON "conversations"("conversation_type", "status");

-- CreateIndex
CREATE INDEX "conversation_participant_type_idx" ON "conversations"("participant_id", "conversation_type");

-- CreateIndex
CREATE INDEX "group_participant_participant_id_idx" ON "group_participants"("participant_id");

-- CreateIndex
CREATE INDEX "message_timestamp_idx" ON "messages"("timestamp");

-- CreateIndex
CREATE INDEX "participant_person_relationship_idx" ON "participant_persons"("relationship");

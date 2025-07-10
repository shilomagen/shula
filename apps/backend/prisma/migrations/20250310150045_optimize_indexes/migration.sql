-- CreateIndex
CREATE INDEX "conversations_participant_id_idx" ON "conversations"("participant_id");

-- CreateIndex
CREATE INDEX "conversations_participant_id_status_idx" ON "conversations"("participant_id", "status");

-- CreateIndex
CREATE INDEX "media_distributions_status_idx" ON "media_distributions"("status");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE INDEX "participant_persons_participant_id_idx" ON "participant_persons"("participant_id");

-- CreateIndex
CREATE INDEX "participant_persons_person_id_idx" ON "participant_persons"("person_id");

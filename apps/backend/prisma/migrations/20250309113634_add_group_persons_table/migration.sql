-- CreateTable
CREATE TABLE "group_persons" (
    "group_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_persons_pkey" PRIMARY KEY ("group_id","person_id")
);

-- CreateIndex
CREATE INDEX "group_person_group_id_idx" ON "group_persons"("group_id");

-- CreateIndex
CREATE INDEX "group_person_person_id_idx" ON "group_persons"("person_id");

-- AddForeignKey
ALTER TABLE "group_persons" ADD CONSTRAINT "group_persons_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_persons" ADD CONSTRAINT "group_persons_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

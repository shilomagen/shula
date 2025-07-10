-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL,
    "whatsapp_group_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" UUID NOT NULL,
    "phone_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_participants" (
    "group_id" UUID NOT NULL,
    "participant_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_participants_pkey" PRIMARY KEY ("group_id","participant_id")
);

-- CreateTable
CREATE TABLE "persons" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "participant_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "face_data" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "feature_vector" BYTEA NOT NULL,
    "quality" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "face_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" UUID NOT NULL,
    "original_url" TEXT NOT NULL,
    "processing_status" TEXT NOT NULL DEFAULT 'pending',
    "source_group_id" UUID,
    "uploaded_by" UUID,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo_persons" (
    "photo_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "bounding_box" JSONB,

    CONSTRAINT "photo_persons_pkey" PRIMARY KEY ("photo_id","person_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "groups_whatsapp_group_id_key" ON "groups"("whatsapp_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "participants_phone_number_key" ON "participants"("phone_number");

-- AddForeignKey
ALTER TABLE "group_participants" ADD CONSTRAINT "group_participants_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_participants" ADD CONSTRAINT "group_participants_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_data" ADD CONSTRAINT "face_data_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_source_group_id_fkey" FOREIGN KEY ("source_group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_persons" ADD CONSTRAINT "photo_persons_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_persons" ADD CONSTRAINT "photo_persons_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "whatsapp_status" (
    "id" TEXT NOT NULL DEFAULT 'current',
    "is_healthy" BOOLEAN NOT NULL DEFAULT false,
    "state" TEXT,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "qr_code" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "whatsapp_status_pkey" PRIMARY KEY ("id")
);

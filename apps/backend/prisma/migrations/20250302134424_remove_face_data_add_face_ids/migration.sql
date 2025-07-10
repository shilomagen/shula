/*
  Warnings:

  - You are about to drop the `face_data` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "face_data" DROP CONSTRAINT "face_data_person_id_fkey";

-- AlterTable
ALTER TABLE "persons" ADD COLUMN     "faceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "rekognition_collection_id" TEXT;

-- DropTable
DROP TABLE "face_data";

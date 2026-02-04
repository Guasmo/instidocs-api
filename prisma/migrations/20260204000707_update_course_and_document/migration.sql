-- CreateEnum
CREATE TYPE "Section" AS ENUM ('MATUTINA', 'VESPERTINA', 'NOCTURNA');

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "endYear" INTEGER,
ADD COLUMN     "section" "Section" NOT NULL DEFAULT 'MATUTINA',
ADD COLUMN     "startYear" INTEGER;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "links" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "accentColor" TEXT,
ADD COLUMN     "brandColor" TEXT,
ADD COLUMN     "customDomain" TEXT,
ADD COLUMN     "watermarkEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "watermarkOpacity" DOUBLE PRECISION DEFAULT 0.3,
ADD COLUMN     "watermarkText" TEXT;

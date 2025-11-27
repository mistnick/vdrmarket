-- AlterTable: Add isActive field to users table
ALTER TABLE "users" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex: Add index for isActive to optimize queries filtering by active status
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

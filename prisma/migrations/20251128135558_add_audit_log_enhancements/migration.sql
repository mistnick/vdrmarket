-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "hash" TEXT,
ADD COLUMN     "previousHash" TEXT,
ALTER COLUMN "resourceId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

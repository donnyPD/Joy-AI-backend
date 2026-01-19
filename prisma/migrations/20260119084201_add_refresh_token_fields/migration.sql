-- AlterTable
ALTER TABLE "users" ADD COLUMN     "jobberRefreshToken" TEXT,
ADD COLUMN     "jobberTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "users_jobberAccountId_idx" ON "users"("jobberAccountId");

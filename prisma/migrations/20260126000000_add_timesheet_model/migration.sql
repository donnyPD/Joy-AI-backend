-- CreateTable
CREATE TABLE IF NOT EXISTS "timesheets" (
    "id" TEXT NOT NULL,
    "jId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "durationSeconds" TEXT,
    "hours" TEXT,
    "note" TEXT,
    "jobJId" TEXT,
    "jobNumber" TEXT,
    "jobTitle" TEXT,
    "clientJId" TEXT,
    "clientName" TEXT,
    "userJId" TEXT,
    "userName" TEXT,
    "workingOn" TEXT,
    "date" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "timeSheetJson" TEXT,
    "jobJson" TEXT,
    "clientJson" TEXT,
    "userJson" TEXT,
    "dbCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dbUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timesheets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "timesheets_jId_key" ON "timesheets"("jId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "timesheets_jobJId_idx" ON "timesheets"("jobJId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "timesheets_clientJId_idx" ON "timesheets"("clientJId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "timesheets_userJId_idx" ON "timesheets"("userJId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "timesheets_jobNumber_idx" ON "timesheets"("jobNumber");

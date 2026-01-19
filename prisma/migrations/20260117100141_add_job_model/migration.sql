-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "jId" TEXT NOT NULL,
    "jobNumber" TEXT,
    "jobType" TEXT,
    "title" TEXT,
    "jobStatus" TEXT,
    "clientJId" TEXT,
    "clientName" TEXT,
    "clientEmail" TEXT,
    "clientPhone" TEXT,
    "servicePropertyName" TEXT,
    "serviceStreet" TEXT,
    "serviceCity" TEXT,
    "serviceProvince" TEXT,
    "serviceZip" TEXT,
    "serviceCountry" TEXT,
    "billingType" TEXT,
    "billingStreet" TEXT,
    "billingCity" TEXT,
    "billingProvince" TEXT,
    "billingZip" TEXT,
    "createdAt" TIMESTAMP(3),
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdDate" TEXT,
    "scheduleStartDate" TEXT,
    "scheduleEndDate" TEXT,
    "closedDate" TEXT,
    "visitFrequency" TEXT,
    "billingFrequency" TEXT,
    "automaticInvoicing" TEXT,
    "visitsAssignedTo" TEXT,
    "completedVisits" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "lineItemsJson" TEXT,
    "lineItems" TEXT,
    "numberOfInvoices" TEXT,
    "invoicesJson" TEXT,
    "quoteNumber" TEXT,
    "salesperson" TEXT,
    "instructions" TEXT,
    "additionalInstructions" TEXT,
    "typeOfProperty" TEXT,
    "frequency" TEXT,
    "referredBy" TEXT,
    "birthdayMonth" TEXT,
    "typeOfCleaning" TEXT,
    "hours" TEXT,
    "cleaningInstructions" TEXT,
    "howToGetInTheHouse" TEXT,
    "detailToGetInTheHouse" TEXT,
    "cleanInsideOfTheStove" TEXT,
    "cleanInsideOfTheFridge" TEXT,
    "windowsToBeCleaned" TEXT,
    "glassDoorsToBeCleaned" TEXT,
    "typerOfProductsToUse" TEXT,
    "squareFoot" TEXT,
    "exactSqFt" TEXT,
    "zone" TEXT,
    "parkingDetails" TEXT,
    "responsibidProfile" TEXT,
    "preferredTimeOfContact" TEXT,
    "pets" TEXT,
    "clientsProductsNotes" TEXT,
    "trashCanInventory" TEXT,
    "changeSheets" TEXT,
    "cleaningTech" TEXT,
    "customFieldsJson" TEXT,
    "clientJson" TEXT,
    "propertyJson" TEXT,
    "visitsJson" TEXT,
    "total" TEXT,
    "dbCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dbUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jobs_jId_key" ON "jobs"("jId");

-- CreateIndex
CREATE INDEX "jobs_clientJId_idx" ON "jobs"("clientJId");

-- CreateIndex
CREATE INDEX "jobs_jobNumber_idx" ON "jobs"("jobNumber");

-- CreateIndex
CREATE INDEX "jobs_jobType_idx" ON "jobs"("jobType");

-- CreateIndex
CREATE INDEX "jobs_jobStatus_idx" ON "jobs"("jobStatus");

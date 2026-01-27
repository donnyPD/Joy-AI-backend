-- CreateTable
CREATE TABLE IF NOT EXISTS "visits" (
    "id" TEXT NOT NULL,
    "jId" TEXT NOT NULL,
    "visitTitle" TEXT,
    "visitStatus" TEXT,
    "instructions" TEXT,
    "date" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3),
    "visitCompletedDate" TEXT,
    "jobJId" TEXT,
    "jobNumber" TEXT,
    "jobType" TEXT,
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
    "assignedTo" TEXT,
    "lineItemsJson" TEXT,
    "lineItems" TEXT,
    "oneOffJob" TEXT,
    "visitBased" TEXT,
    "scheduleDuration" TEXT,
    "timeTracked" TEXT,
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
    "additionalInstructions" TEXT,
    "pets" TEXT,
    "clientsProductsNotes" TEXT,
    "trashCanInventory" TEXT,
    "changeSheets" TEXT,
    "cleaningTech" TEXT,
    "customFieldsJson" TEXT,
    "clientJson" TEXT,
    "propertyJson" TEXT,
    "jobJson" TEXT,
    "assignedUsersJson" TEXT,
    "lineItemsFullJson" TEXT,
    "dbCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dbUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "visits_jId_key" ON "visits"("jId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "visits_jobJId_idx" ON "visits"("jobJId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "visits_jobNumber_idx" ON "visits"("jobNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "visits_clientJId_idx" ON "visits"("clientJId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "visits_visitStatus_idx" ON "visits"("visitStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "visits_date_idx" ON "visits"("date");

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "jId" TEXT NOT NULL,
    "quoteNumber" TEXT,
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
    "title" TEXT,
    "status" TEXT,
    "salesperson" TEXT,
    "subtotal" TEXT,
    "total" TEXT,
    "discount" TEXT,
    "collectedDeposit" TEXT,
    "requiredDeposit" TEXT,
    "draftedDate" TEXT,
    "sentDate" TEXT,
    "changesRequestedDate" TEXT,
    "approvedDate" TEXT,
    "convertedDate" TEXT,
    "archivedDate" TEXT,
    "sentAt" TIMESTAMP(3),
    "clientHubViewedAt" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "lineItemsJson" TEXT,
    "lineItems" TEXT,
    "jobNumbers" TEXT,
    "timeEstimated" TEXT,
    "desiredFrequency" TEXT,
    "typeOfCleaning" TEXT,
    "exactSqFt" TEXT,
    "additionalRequest" TEXT,
    "zone" TEXT,
    "dirtScale" TEXT,
    "birthdayMonth" TEXT,
    "referredBy" TEXT,
    "typeOfProperty" TEXT,
    "parkingDetails" TEXT,
    "squareFoot" TEXT,
    "frequency" TEXT,
    "preferredTimeOfContact" TEXT,
    "customFieldsJson" TEXT,
    "clientJson" TEXT,
    "propertyJson" TEXT,
    "amountsJson" TEXT,
    "leadSource" TEXT,
    "sentTo" TEXT,
    "sentByUser" TEXT,
    "dbCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dbUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "jId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "clientJId" TEXT,
    "replied" BOOLEAN NOT NULL DEFAULT false,
    "statusForAutomation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quotes_jId_key" ON "quotes"("jId");

-- CreateIndex
CREATE INDEX "quotes_clientJId_idx" ON "quotes"("clientJId");

-- CreateIndex
CREATE INDEX "quotes_quoteNumber_idx" ON "quotes"("quoteNumber");

-- CreateIndex
CREATE INDEX "quotes_status_idx" ON "quotes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tags_jId_key" ON "tags"("jId");

-- CreateIndex
CREATE INDEX "tags_clientJId_idx" ON "tags"("clientJId");

-- CreateIndex
CREATE INDEX "tags_label_idx" ON "tags"("label");

-- CreateIndex
CREATE INDEX "tags_replied_idx" ON "tags"("replied");

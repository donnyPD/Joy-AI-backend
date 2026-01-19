-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "jId" TEXT NOT NULL,
    "createdDate" TIMESTAMP(3),
    "isCompany" BOOLEAN NOT NULL DEFAULT false,
    "displayName" TEXT,
    "companyName" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "mainPhone" TEXT,
    "workPhone" TEXT,
    "mobilePhone" TEXT,
    "homePhone" TEXT,
    "faxPhone" TEXT,
    "otherPhone" TEXT,
    "tags" TEXT,
    "billingStreet1" TEXT,
    "billingStreet2" TEXT,
    "billingCity" TEXT,
    "billingState" TEXT,
    "billingCountry" TEXT,
    "billingZip" TEXT,
    "servicePropertyName" TEXT,
    "serviceStreet1" TEXT,
    "serviceStreet2" TEXT,
    "serviceCity" TEXT,
    "serviceState" TEXT,
    "serviceCountry" TEXT,
    "serviceZip" TEXT,
    "cftHavePets" TEXT,
    "cftHaveKids" TEXT,
    "cftTrashCanInventory" TEXT,
    "cftAreasToAvoid" TEXT,
    "cfsChangeSheets" TEXT,
    "cftPreferredTimeRecurring" TEXT,
    "cfsPreferredTimeContact" TEXT,
    "cftTypeOfProperty" TEXT,
    "cftAdditionalInfo" TEXT,
    "cftResponsibidProfile" TEXT,
    "pftAddressAdditionalInfo" TEXT,
    "pftApartmentNumber" TEXT,
    "pftFootage" TEXT,
    "pftNotes" TEXT,
    "receivesAutoVisitReminders" BOOLEAN NOT NULL DEFAULT false,
    "receivesAutoJobFollowups" BOOLEAN NOT NULL DEFAULT false,
    "receivesAutoQuoteFollowups" BOOLEAN NOT NULL DEFAULT false,
    "receivesAutoInvoiceFollowups" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "textMessageEnabledPhone" TEXT,
    "leadSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_jId_key" ON "clients"("jId");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "clients"("email");

-- CreateIndex
CREATE INDEX "clients_jId_idx" ON "clients"("jId");

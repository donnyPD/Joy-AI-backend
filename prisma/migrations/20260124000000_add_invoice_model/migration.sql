-- CreateTable
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL,
    "jId" TEXT NOT NULL,
    "invoiceNumber" TEXT,
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
    "billingStreet" TEXT,
    "billingCity" TEXT,
    "billingProvince" TEXT,
    "billingZip" TEXT,
    "subject" TEXT,
    "status" TEXT,
    "salesperson" TEXT,
    "createdDate" TEXT,
    "issuedDate" TEXT,
    "dueDate" TEXT,
    "total" TEXT,
    "balance" TEXT,
    "preTaxTotal" TEXT,
    "tip" TEXT,
    "taxPercent" TEXT,
    "taxAmount" TEXT,
    "deposit" TEXT,
    "discount" TEXT,
    "lineItemsJson" TEXT,
    "lineItems" TEXT,
    "jobNumbers" TEXT,
    "birthdayMonth" TEXT,
    "frequency" TEXT,
    "typeOfProperty" TEXT,
    "parkingDetails" TEXT,
    "squareFoot" TEXT,
    "exactSqFt" TEXT,
    "preferredTimeOfContact" TEXT,
    "zone" TEXT,
    "cleaningTech" TEXT,
    "referredBy" TEXT,
    "leadSource" TEXT,
    "sentTo" TEXT,
    "lateBy" TEXT,
    "markedPaidDate" TEXT,
    "daysToPaid" TEXT,
    "lastContacted" TEXT,
    "visitsAssignedTo" TEXT,
    "cleaningTechAssigned" TEXT,
    "viewedInClientHub" TEXT,
    "customFieldsJson" TEXT,
    "clientJson" TEXT,
    "propertyJson" TEXT,
    "amountsJson" TEXT,
    "paymentRecordsJson" TEXT,
    "dbCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dbUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_jId_key" ON "invoices"("jId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "invoices_clientJId_idx" ON "invoices"("clientJId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "invoices_invoiceNumber_idx" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices"("status");

-- Add missing job sheet columns
ALTER TABLE "jobs" ADD COLUMN "leadSource" TEXT;
ALTER TABLE "jobs" ADD COLUMN "onlineBooking" TEXT;
ALTER TABLE "jobs" ADD COLUMN "expensesTotal" TEXT;
ALTER TABLE "jobs" ADD COLUMN "timeTracked" TEXT;
ALTER TABLE "jobs" ADD COLUMN "labourCostTotal" TEXT;
ALTER TABLE "jobs" ADD COLUMN "lineItemCostTotal" TEXT;
ALTER TABLE "jobs" ADD COLUMN "totalCosts" TEXT;
ALTER TABLE "jobs" ADD COLUMN "quoteDiscount" TEXT;
ALTER TABLE "jobs" ADD COLUMN "totalRevenue" TEXT;
ALTER TABLE "jobs" ADD COLUMN "profit" TEXT;
ALTER TABLE "jobs" ADD COLUMN "profitPercent" TEXT;
ALTER TABLE "jobs" ADD COLUMN "replied" TEXT;

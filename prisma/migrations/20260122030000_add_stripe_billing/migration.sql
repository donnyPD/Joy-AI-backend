-- Add stripeCustomerId to users
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_stripeCustomerId_key"
ON "users"("stripeCustomerId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "stripe_plans" (
  "id" TEXT NOT NULL,
  "planKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "interval" TEXT NOT NULL,
  "stripeProductId" TEXT NOT NULL,
  "stripePriceId" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "stripe_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "stripe_plans_planKey_key"
ON "stripe_plans"("planKey");

-- CreateTable
CREATE TABLE IF NOT EXISTS "stripe_subscriptions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "planKey" TEXT NOT NULL,
  "stripeSubscriptionId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "currentPeriodEnd" TIMESTAMP(3),
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "stripe_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "stripe_subscriptions_stripeSubscriptionId_key"
ON "stripe_subscriptions"("stripeSubscriptionId");

ALTER TABLE "stripe_subscriptions"
ADD CONSTRAINT "stripe_subscriptions_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

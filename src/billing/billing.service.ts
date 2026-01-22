import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

const PLAN_DEFS = [
  { planKey: 'free-trial', name: 'Free Trial', amount: 0 },
  { planKey: 'tier-1', name: 'Tier 1', amount: 2900 },
  { planKey: 'tier-2', name: 'Tier 2', amount: 7900 },
  { planKey: 'tier-3', name: 'Tier 3', amount: 14900 },
];

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(secretKey, { apiVersion: '2024-04-10' });
  }

  async seedPlans(token: string) {
    const expected = this.configService.get<string>('STRIPE_SEED_TOKEN');
    if (!expected || token !== expected) {
      throw new BadRequestException('Invalid seed token');
    }

    for (const plan of PLAN_DEFS) {
      const existing = await this.prisma.stripePlan.findUnique({
        where: { planKey: plan.planKey },
      });

      let productId = existing?.stripeProductId;
      let product: Stripe.Product | null = null;
      let productExistsInCurrentAccount = false;

      // First, check if the product from DB exists in the CURRENT Stripe account
      if (productId) {
        try {
          product = await this.stripe.products.retrieve(productId);
          productExistsInCurrentAccount = true;
        } catch (error) {
          // Product doesn't exist in current account (likely different Stripe account)
          productId = undefined;
          product = null;
        }
      }

      // If product doesn't exist in current account, search for it by metadata
      // (in case it was created in this account before)
      if (!productExistsInCurrentAccount) {
        try {
          const searchResult = await this.stripe.products.search({
            query: `metadata['planKey']:'${plan.planKey}'`,
            limit: 1,
          });
          if (searchResult.data.length > 0) {
            product = searchResult.data[0];
            productId = product.id;
            productExistsInCurrentAccount = true;
          }
        } catch (error) {
          // Search may be unavailable; ignore and create a new product.
        }
      }

      // If still no product found in current account, create a new one
      if (!productExistsInCurrentAccount) {
        product = await this.stripe.products.create({
          name: plan.name,
          metadata: { planKey: plan.planKey },
        });
        productId = product.id;
      }

      if (!product && productId) {
        product = await this.stripe.products.retrieve(productId);
      }

      // Ensure productId is defined at this point
      if (!productId) {
        throw new Error(
          `Failed to get or create product for plan: ${plan.planKey}`,
        );
      }

      const prices = await this.stripe.prices.list({
        product: productId,
        active: true,
        limit: 100,
      });
      const existingPrice = prices.data.find((price) => {
        const recurring = price.recurring;
        return (
          price.currency === 'usd' &&
          price.unit_amount === plan.amount &&
          recurring?.interval === 'month'
        );
      });

      const price = existingPrice
        ? existingPrice
        : await this.stripe.prices.create({
            unit_amount: plan.amount,
            currency: 'usd',
            recurring: { interval: 'month' },
            product: productId,
          });

      if (existing) {
        await this.prisma.stripePlan.update({
          where: { planKey: plan.planKey },
          data: {
            name: plan.name,
            amount: plan.amount,
            currency: 'usd',
            interval: 'month',
            stripeProductId: productId,
            stripePriceId: price.id,
            active: true,
          },
        });
      } else {
        await this.prisma.stripePlan.create({
          data: {
            planKey: plan.planKey,
            name: plan.name,
            amount: plan.amount,
            currency: 'usd',
            interval: 'month',
            stripeProductId: productId,
            stripePriceId: price.id,
            active: true,
          },
        });
      }
    }

    return { ok: true };
  }

  async createCheckoutSession(userId: string, planKey: string) {
    if (!planKey) {
      throw new BadRequestException('Plan key is required');
    }

    const plan = await this.prisma.stripePlan.findUnique({
      where: { planKey },
    });
    if (!plan) {
      throw new BadRequestException('Invalid plan');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId },
      });
      customerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const successUrl = this.configService.get<string>('STRIPE_SUCCESS_URL');
    const cancelUrl = this.configService.get<string>('STRIPE_CANCEL_URL');
    if (!successUrl || !cancelUrl) {
      throw new Error('Stripe success/cancel URLs are not configured');
    }

    const brandName =
      this.configService.get<string>('STRIPE_BRAND_NAME') || 'Joy AI';
    const supportEmail =
      this.configService.get<string>('STRIPE_SUPPORT_EMAIL');
    const termsUrl = this.configService.get<string>('STRIPE_TERMS_URL');
    const privacyUrl = this.configService.get<string>('STRIPE_PRIVACY_URL');

    const supportBits: string[] = [];
    if (supportEmail) {
      supportBits.push(`Support: ${supportEmail}`);
    }
    if (termsUrl) {
      supportBits.push(`Terms: ${termsUrl}`);
    }
    if (privacyUrl) {
      supportBits.push(`Privacy: ${privacyUrl}`);
    }

    const customText =
      supportBits.length > 0
        ? {
            submit: {
              message: `${brandName} • ${supportBits.join(' • ')}`,
            },
          }
        : undefined;

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      subscription_data: {
        metadata: { userId, planKey },
      },
      // Note: To require Terms of Service consent, you must first set the Terms URL
      // in Stripe Dashboard → Settings → Public business details
      // consent_collection: termsUrl ? { terms_of_service: 'required' } : undefined,
      custom_text: customText,
      success_url: `${successUrl}?subscription=success`,
      cancel_url: `${cancelUrl}?canceled=true`,
      client_reference_id: userId,
    });

    return { url: session.url };
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );

    if (event.type === 'customer.subscription.created' ||
        event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      const planKey = subscription.metadata?.planKey;

      if (userId && planKey) {
        await this.prisma.stripeSubscription.upsert({
          where: { stripeSubscriptionId: subscription.id },
          update: {
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
            currentPeriodEnd: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null,
          },
          create: {
            userId,
            planKey,
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
            currentPeriodEnd: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null,
          },
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      await this.prisma.stripeSubscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: 'canceled' },
      });
    }

    return { received: true };
  }
}

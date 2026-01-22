import { Body, Controller, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('seed-plans')
  async seedPlans(@Body('token') token: string) {
    return this.billingService.seedPlans(token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout-session')
  async createCheckoutSession(@Req() req, @Body('planKey') planKey: string) {
    return this.billingService.createCheckoutSession(req.user.userId, planKey);
  }

  @Post('webhook')
  async webhook(@Headers('stripe-signature') signature: string, @Req() req) {
    return this.billingService.handleWebhook(signature, req.body);
  }
}

import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ClientsService } from '../../clients/clients/clients.service';
import { QuotesService } from '../../quotes/quotes/quotes.service';
import { JobsService } from '../../jobs/jobs/jobs.service';
import * as crypto from 'crypto';

@Controller('webhooks/jobber')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private clientsService: ClientsService,
    private quotesService: QuotesService,
    private jobsService: JobsService,
  ) {}

  @Post('client/create')
  @HttpCode(HttpStatus.OK)
  async handleClientCreate(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook CLIENT_CREATE payload:', payload);
    // Verify HMAC signature (optional but recommended)
    // this.verifySignature(payload, signature);

    // Process asynchronously (don't block webhook response)
    this.clientsService.handleClientCreate(payload).catch((error) => {
      this.logger.error('Error processing client create:', error);
    });

    return { received: true };
  }

  @Post('client/update')
  @HttpCode(HttpStatus.OK)
  async handleClientUpdate(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook CLIENT_UPDATE payload:', payload);
    // this.verifySignature(payload, signature);

    this.clientsService.handleClientUpdate(payload).catch((error) => {
      this.logger.error('Error processing client update:', error);
    });

    return { received: true };
  }

  @Post('client/destroy')
  @HttpCode(HttpStatus.OK)
  async handleClientDestroy(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook CLIENT_DESTROY payload:', payload);
    // this.verifySignature(payload, signature);

    this.clientsService.handleClientDestroy(payload).catch((error) => {
      this.logger.error('Error processing client destroy:', error);
    });

    return { received: true };
  }

  @Post('quote/create')
  @HttpCode(HttpStatus.OK)
  async handleQuoteCreate(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook QUOTE_CREATE payload:', payload);
    // this.verifySignature(payload, signature);

    this.quotesService.handleQuoteCreate(payload).catch((error) => {
      this.logger.error('Error processing quote create:', error);
    });

    return { received: true };
  }

  @Post('quote/update')
  @HttpCode(HttpStatus.OK)
  async handleQuoteUpdate(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook QUOTE_UPDATE payload:', payload);
    // this.verifySignature(payload, signature);

    this.quotesService.handleQuoteUpdate(payload).catch((error) => {
      this.logger.error('Error processing quote update:', error);
    });

    return { received: true };
  }

  @Post('quote/sent')
  @HttpCode(HttpStatus.OK)
  async handleQuoteSent(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook QUOTE_SENT payload:', payload);
    // this.verifySignature(payload, signature);

    this.quotesService.handleQuoteSent(payload).catch((error) => {
      this.logger.error('Error processing quote sent:', error);
    });

    return { received: true };
  }

  @Post('quote/approved')
  @HttpCode(HttpStatus.OK)
  async handleQuoteApproved(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook QUOTE_APPROVED payload:', payload);
    // this.verifySignature(payload, signature);

    this.quotesService.handleQuoteApproved(payload).catch((error) => {
      this.logger.error('Error processing quote approved:', error);
    });

    return { received: true };
  }

  @Post('quote/destroy')
  @HttpCode(HttpStatus.OK)
  async handleQuoteDestroy(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook QUOTE_DESTROY payload:', payload);
    // this.verifySignature(payload, signature);

    this.quotesService.handleQuoteDestroy(payload).catch((error) => {
      this.logger.error('Error processing quote destroy:', error);
    });

    return { received: true };
  }

  // Job Webhook Endpoints
  @Post('job/create')
  @HttpCode(HttpStatus.OK)
  async handleJobCreate(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook JOB_CREATE payload:', payload);
    // this.verifySignature(payload, signature);

    this.jobsService.handleJobCreate(payload).catch((error) => {
      this.logger.error('Error processing job create:', error);
    });

    return { received: true };
  }

  @Post('job/update')
  @HttpCode(HttpStatus.OK)
  async handleJobUpdate(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook JOB_UPDATE payload:', payload);
    // this.verifySignature(payload, signature);

    this.jobsService.handleJobUpdate(payload).catch((error) => {
      this.logger.error('Error processing job update:', error);
    });

    return { received: true };
  }

  @Post('job/destroy')
  @HttpCode(HttpStatus.OK)
  async handleJobDestroy(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook JOB_DESTROY payload:', payload);
    // this.verifySignature(payload, signature);

    this.jobsService.handleJobDestroy(payload).catch((error) => {
      this.logger.error('Error processing job destroy:', error);
    });

    return { received: true };
  }

  @Post('job/closed')
  @HttpCode(HttpStatus.OK)
  async handleJobClosed(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook JOB_CLOSED payload:', payload);
    // this.verifySignature(payload, signature);

    this.jobsService.handleJobClosed(payload).catch((error) => {
      this.logger.error('Error processing job closed:', error);
    });

    return { received: true };
  }

  private verifySignature(payload: any, signature: string) {
    const secret = process.env.JOBBER_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.warn('Webhook secret not configured, skipping verification');
      return;
    }

    const hmac = crypto.createHmac('sha256', secret);
    const calculatedSignature = hmac.update(JSON.stringify(payload)).digest('base64');

    if (calculatedSignature !== signature) {
      throw new Error('Invalid webhook signature');
    }
  }
}

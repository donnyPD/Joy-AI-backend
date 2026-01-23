import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ClientsService } from '../../clients/clients/clients.service';
import { QuotesService } from '../../quotes/quotes/quotes.service';
import { JobsService } from '../../jobs/jobs/jobs.service';
import { InvoicesService } from '../../invoices/invoices/invoices.service';
import { VisitsService } from '../../visits/visits/visits.service';
import { TimesheetsService } from '../../timesheets/timesheets/timesheets.service';
import * as crypto from 'crypto';

@Controller('webhooks/jobber')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private clientsService: ClientsService,
    private quotesService: QuotesService,
    private jobsService: JobsService,
    private invoicesService: InvoicesService,
    private visitsService: VisitsService,
    private timesheetsService: TimesheetsService,
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
    this.logger.log('🔔 Webhook JOB_CREATE received');
    this.logger.log('Payload:', JSON.stringify(payload, null, 2));
    // this.verifySignature(payload, signature);

    this.jobsService.handleJobCreate(payload).catch((error) => {
      this.logger.error('❌ Error processing job create:', error);
      this.logger.error('Error stack:', error.stack);
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

  // Invoice Webhook Endpoints
  @Post('invoice/create')
  @HttpCode(HttpStatus.OK)
  async handleInvoiceCreate(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook INVOICE_CREATE payload:', payload);
    // this.verifySignature(payload, signature);

    this.invoicesService.handleInvoiceCreate(payload).catch((error) => {
      this.logger.error('Error processing invoice create:', error);
    });

    return { received: true };
  }

  @Post('invoice/update')
  @HttpCode(HttpStatus.OK)
  async handleInvoiceUpdate(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook INVOICE_UPDATE payload:', payload);
    // this.verifySignature(payload, signature);

    this.invoicesService.handleInvoiceUpdate(payload).catch((error) => {
      this.logger.error('Error processing invoice update:', error);
    });

    return { received: true };
  }

  @Post('invoice/destroy')
  @HttpCode(HttpStatus.OK)
  async handleInvoiceDestroy(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook INVOICE_DESTROY payload:', payload);
    // this.verifySignature(payload, signature);

    this.invoicesService.handleInvoiceDestroy(payload).catch((error) => {
      this.logger.error('Error processing invoice destroy:', error);
    });

    return { received: true };
  }

  // Visit Webhook Endpoints
  @Post('visit/create')
  @HttpCode(HttpStatus.OK)
  async handleVisitCreate(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook VISIT_CREATE payload:', payload);
    // this.verifySignature(payload, signature);

    this.visitsService.handleVisitCreate(payload).catch((error) => {
      this.logger.error('Error processing visit create:', error);
    });

    return { received: true };
  }

  @Post('visit/update')
  @HttpCode(HttpStatus.OK)
  async handleVisitUpdate(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook VISIT_UPDATE payload:', payload);
    // this.verifySignature(payload, signature);

    this.visitsService.handleVisitUpdate(payload).catch((error) => {
      this.logger.error('Error processing visit update:', error);
    });

    return { received: true };
  }

  @Post('visit/destroy')
  @HttpCode(HttpStatus.OK)
  async handleVisitDestroy(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook VISIT_DESTROY payload:', payload);
    // this.verifySignature(payload, signature);

    this.visitsService.handleVisitDestroy(payload).catch((error) => {
      this.logger.error('Error processing visit destroy:', error);
    });

    return { received: true };
  }

  @Post('visit/completed')
  @HttpCode(HttpStatus.OK)
  async handleVisitCompleted(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook VISIT_COMPLETED payload:', payload);
    // this.verifySignature(payload, signature);

    this.visitsService.handleVisitCompleted(payload).catch((error) => {
      this.logger.error('Error processing visit completed:', error);
    });

    return { received: true };
  }

  @Post('timesheet/create')
  @HttpCode(HttpStatus.OK)
  async handleTimesheetCreate(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook TIMESHEET_CREATE payload:', payload);
    // this.verifySignature(payload, signature);

    this.timesheetsService.handleTimesheetCreate(payload).catch((error) => {
      this.logger.error('Error processing timesheet create:', error);
    });

    return { received: true };
  }

  @Post('timesheet/update')
  @HttpCode(HttpStatus.OK)
  async handleTimesheetUpdate(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook TIMESHEET_UPDATE payload:', payload);
    // this.verifySignature(payload, signature);

    this.timesheetsService.handleTimesheetUpdate(payload).catch((error) => {
      this.logger.error('Error processing timesheet update:', error);
    });

    return { received: true };
  }

  @Post('timesheet/destroy')
  @HttpCode(HttpStatus.OK)
  async handleTimesheetDestroy(
    @Body() payload: any,
    @Headers('x-jobber-hmac-sha256') signature: string,
  ) {
    console.log('Webhook TIMESHEET_DESTROY payload:', payload);
    // this.verifySignature(payload, signature);

    this.timesheetsService.handleTimesheetDestroy(payload).catch((error) => {
      this.logger.error('Error processing timesheet destroy:', error);
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

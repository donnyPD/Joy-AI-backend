import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JobberApiService } from './jobber/jobber-api.service';
import { JobberClientsService } from './jobber/jobber-clients.service';
import { JobberJobsService } from './jobber/jobber-jobs.service';
import { JobberQuotesService } from './jobber/jobber-quotes.service';
import { JobberInvoicesService } from './jobber/jobber-invoices.service';
import { JobberVisitsService } from './jobber/jobber-visits.service';
import { JobberTimesheetsService } from './jobber/jobber-timesheets.service';
import { JobberTagsService } from './jobber/jobber-tags.service';
import { WebhookService } from './webhook/webhook.service';

@Module({
  imports: [ConfigModule],
  providers: [
    JobberApiService,
    JobberClientsService,
    JobberJobsService,
    JobberQuotesService,
    JobberInvoicesService,
    JobberVisitsService,
    JobberTimesheetsService,
    JobberTagsService,
    WebhookService,
  ],
  exports: [
    JobberApiService,
    JobberClientsService,
    JobberJobsService,
    JobberQuotesService,
    JobberInvoicesService,
    JobberVisitsService,
    JobberTimesheetsService,
    JobberTagsService,
    WebhookService,
  ],
})
export class JobberModule {}

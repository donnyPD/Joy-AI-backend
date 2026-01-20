import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { JobberApiService } from './jobber/jobber-api.service';
import { JobberClientsService } from './jobber/jobber-clients.service';
import { JobberJobsService } from './jobber/jobber-jobs.service';
import { JobberQuotesService } from './jobber/jobber-quotes.service';
import { JobberInvoicesService } from './jobber/jobber-invoices.service';
import { JobberVisitsService } from './jobber/jobber-visits.service';
import { JobberTimesheetsService } from './jobber/jobber-timesheets.service';
import { JobberTagsService } from './jobber/jobber-tags.service';
import { JobberDataController } from './jobber/jobber-data.controller';
import { WebhookService } from './webhook/webhook.service';

@Module({
  imports: [ConfigModule, forwardRef(() => AuthModule)],
  controllers: [JobberDataController],
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

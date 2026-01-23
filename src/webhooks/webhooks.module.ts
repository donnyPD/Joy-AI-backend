import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks/webhooks.controller';
import { ClientsModule } from '../clients/clients.module';
import { QuotesModule } from '../quotes/quotes.module';
import { JobsModule } from '../jobs/jobs.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { VisitsModule } from '../visits/visits.module';
import { TimesheetsModule } from '../timesheets/timesheets.module';

@Module({
  imports: [ClientsModule, QuotesModule, JobsModule, InvoicesModule, VisitsModule, TimesheetsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}

import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks/webhooks.controller';
import { ClientsModule } from '../clients/clients.module';
import { QuotesModule } from '../quotes/quotes.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [ClientsModule, QuotesModule, JobsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { JobberModule } from './jobber/jobber.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ClientsModule } from './clients/clients.module';
import { AuthModule } from './auth/auth.module';
import { ApiModule } from './api/api.module';
import { QuotesModule } from './quotes/quotes.module';
import { TagsModule } from './tags/tags.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    JobberModule,
    WebhooksModule,
    ClientsModule,
    AuthModule,
    ApiModule,
    QuotesModule,
    TagsModule,
    JobsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  // Removed auto webhook registration on startup
  // Webhooks are now registered per-user when they connect their Jobber account via OAuth
  // This happens in JobberOAuthService.handleCallback() after successful OAuth
}

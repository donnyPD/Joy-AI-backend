import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JobberModule } from '../jobber/jobber.module';
import { TagsModule } from '../tags/tags.module';
import { QuotesService } from './quotes/quotes.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, JobberModule, TagsModule, AuthModule],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}

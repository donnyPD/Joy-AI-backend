import { Module } from '@nestjs/common';
import { TimesheetsService } from './timesheets/timesheets.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JobberModule } from '../jobber/jobber.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, JobberModule, AuthModule],
  providers: [TimesheetsService],
  exports: [TimesheetsService],
})
export class TimesheetsModule {}

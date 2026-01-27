import { Module } from '@nestjs/common';
import { VisitsService } from './visits/visits.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JobberModule } from '../jobber/jobber.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, JobberModule, AuthModule],
  providers: [VisitsService],
  exports: [VisitsService],
})
export class VisitsModule {}

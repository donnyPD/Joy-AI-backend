import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { KpiEntriesService } from './kpi-entries/kpi-entries.service';

@Module({
  imports: [PrismaModule],
  providers: [KpiEntriesService],
  exports: [KpiEntriesService],
})
export class KpiEntriesModule {}
